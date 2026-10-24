import Joi from "joi";
import { UseCase } from "../../../shared/application/useCase";
import { RequestRepository } from "../domain/repositories/request.repository";
import { PrismaRequestRepository } from "../infrastructure/persistence/PrismaRequestRepository";
import { createRequestDtoRequestSchema, requestDtoResponseSchema } from "./dtos/request.dto";
import { RFQ_TYPE } from "../../../shared/constants/request/request.contants";
import { storageService } from "../../../shared/infrastructure/storage/storageInstance";
import { UploadDocumentUseCase } from "../../documents/application/UploadDocumentUseCase";
import { matchingQueue, notificationsQueue } from "../../../shared/infrastructure/queue/index.queue";
import { RequestEntity } from "../domain/entities/request.entity";
import { DirectRequestSelfTargetError } from "../domain/errors/request.errors";
import { RequestInvitationRepository } from "../domain/repositories/requestInvitation.repository";
import { PrismaRequestInvitationRepository } from "../infrastructure/persistence/PrismaRequestInvitationRepository";
import { CompanyOfferRepository } from "../../companyOffers/domain/repositories/companyOffer.repository";
import { PrismaCompanyOfferRepository } from "../../companyOffers/infrastructure/persistence/PrismaCompanyOfferRepository";
import { CompanyOfferNotFoundError } from "../../companyOffers/domain/errors/companyOffer.errors";
import { CreateNotificationUseCase } from "../../notifications/application/createNotificationUseCase";
import { NOTIFICATION_TYPE } from "../../notifications/domain/notificationTypes.constants";
import { getIO } from "../../../shared/infrastructure/socket";
import logger from "../../../shared/infrastructure/logger";
import { directRequestFields } from "./helpers/directRequestFields";
import { SubcategoryRepository } from "../../subcategories/domain/repositories/subcategory.repository";
import { PrismaSubcategoryRepository } from "../../subcategories/infrastructure/persistence/PrismaSubcategoryRepository";
import { resolveCategoryAndSubcategory } from "../../subcategories/application/helpers/resolveSubcategory";

interface CreateRequestDto {
    company_id: string;
    product_service: string;
    quantity: number;
    user_id?: string | null;
    unit_id?: number;
    description?: string | null;
    category_id?: number | null;
    subcategory_id?: number | null | '';
    status?: string;
    type: number;
    payment_condition_id?: string | null;
    country_id?: number | null;
    state_id?: number | null;
    city_id?: number | null;
    reach_service?: string | null;
    expiration_date?: Date | null;
    company_offer_id?: string | null;
    rawFiles?: Array<{ file_name: string; buffer: Buffer; mime_type: string }>;
}

interface RequestFileResult {
    id: string;
    request_id: string;
    url: string;
    file_name: string | null;
    created_at: Date | null;
}

interface RequestResult {
    id: string;
    company_id: string;
    user_id: string | null;
    unit_id: number;
    product_service: string;
    quantity: number;
    unit_of_measure: string;
    description: string | null;
    category: string | null;
    category_id: number | null;
    subcategory_id: number | null;
    subcategory: string | null;
    status: string;
    type: string;
    payment_condition_id?: string | null;
    country_id?: number | null;
    state_id?: number | null;
    city_id?: number | null;
    reach_service?: string | null;
    expiration_date: Date | null;
    response_count: number;
    files: RequestFileResult[];
    created_at: Date | null;
    updated_at: Date | null;
}

export class CreateRequestUseCase extends UseCase<CreateRequestDto, RequestResult> {
    protected inputSchema: Joi.Schema = createRequestDtoRequestSchema;
    protected outputSchema: Joi.Schema = requestDtoResponseSchema;
    private readonly requestRepository: RequestRepository;
    private readonly uploadDocumentUseCase: UploadDocumentUseCase;
    private readonly companyOfferRepository: CompanyOfferRepository;
    private readonly invitationRepository: RequestInvitationRepository;
    private readonly subcategoryRepository: SubcategoryRepository;

    constructor() {
        super();
        this.requestRepository = new PrismaRequestRepository();
        this.uploadDocumentUseCase = new UploadDocumentUseCase(storageService);
        this.companyOfferRepository = new PrismaCompanyOfferRepository();
        this.invitationRepository = new PrismaRequestInvitationRepository();
        this.subcategoryRepository = new PrismaSubcategoryRepository();
    }

    protected async implementation(data: CreateRequestDto): Promise<RequestResult> {
        console.log("CreateRequestUseCase implementation started!");
        console.log("data.rawFiles length:", data.rawFiles?.length);
        console.log("data.rawFiles exists:", !!data.rawFiles);
        if (data.rawFiles) {
            console.log("Sample rawFile:", data.rawFiles[0]?.file_name, data.rawFiles[0]?.buffer?.length);
        }

        (data as any).type = RFQ_TYPE[data.type as keyof typeof RFQ_TYPE] || 'product';   
        
        const files: Array<{ url: string; file_name?: string | null }> = [];
        
        if (data.rawFiles && data.rawFiles.length > 0) {
            console.log("Uploading files to R2 via UploadDocumentUseCase...");
            const uploadUseCase = new UploadDocumentUseCase(storageService);
            const publicUrlBase = process.env.S3_PUBLIC_URL || 'https://pub-763f58343d734ddfbcf74e591370f038.r2.dev';

            for (const file of data.rawFiles) {
                try {
                    const result = await uploadUseCase.execute({
                        tenantId: data.company_id,
                        buffer: file.buffer
                    });
                    console.log("File uploaded successfully:", result.fileKey);
                    files.push({ 
                        url: `${publicUrlBase}/${result.fileKey}`, 
                        file_name: file.file_name || null 
                    });
                } catch (err) {
                    console.error("Error uploading file to R2:", err);
                    throw err;
                }
            }
        } else {
            console.log("No rawFiles found to upload!");
        }

        const { rawFiles, ...repoData } = data;
        if (files.length > 0) {
            (repoData as any).files = files;
        }

        // Direct RFQ from a marketplace product: target the offer's company only
        const { company_offer_id } = repoData;
        delete (repoData as any).company_offer_id;
        if (company_offer_id) {
            const offer = await this.companyOfferRepository.findActiveById(company_offer_id);
            if (!offer) throw new CompanyOfferNotFoundError(company_offer_id);
            if (offer.company_id === data.company_id) throw new DirectRequestSelfTargetError();

            (repoData as any).target_company_id = offer.company_id;
            (repoData as any).company_offer_id = offer.id;
            // The offer's subcategory is inherited only when the form keeps the offer's category
            const keepsOfferCategory = !repoData.category_id || repoData.category_id === offer.category_id;
            if (!repoData.category_id && offer.category_id) {
                repoData.category_id = offer.category_id;
            }
            if (keepsOfferCategory && !repoData.subcategory_id && offer.subcategory_id) {
                const [active] = await this.subcategoryRepository.findActiveByIds([offer.subcategory_id]);
                if (active) repoData.subcategory_id = active.id;
            }
        }

        // Optional subcategory: must be active and belong to the category (or sets the category)
        Object.assign(repoData, await resolveCategoryAndSubcategory(this.subcategoryRepository, repoData));

        const created = await this.requestRepository.create(repoData as any);

        if (created.is_direct) {
            await this.deliverDirectRequest(created);
        } else {
            await matchingQueue.add('match-rfq', { rfqId: created.id }, { delay: 1000 });
        }

        return {
            ...directRequestFields(created),
            id: created.id,
            company_id: created.company_id,
            user_id: created.user_id,
            unit_id: (created as any).unit_id,
            product_service: created.product_service,
            quantity: created.quantity,
            unit_of_measure: created.unit_of_measure,
            description: created.description,
            category: created.category,
            category_id: (created as any).category_id ?? null,
            subcategory_id: created.subcategory_id,
            subcategory: created.subcategory,
            status: created.status,
            type: (created as any).type,
            payment_condition_id: created.payment_condition_id,
            country_id: created.country_id,
            state_id: created.state_id,
            city_id: created.city_id,
            reach_service: created.reach_service,
            expiration_date: created.expiration_date,
            response_count: created.response_count,
            files: created.files,
            created_at: created.created_at,
            updated_at: created.updated_at,
        };
    }

    /**
     * Delivers a direct RFQ to its target supplier instead of running the matching job:
     * a single invitation, the usual RFQ email and a real-time in-app notification.
     * Non-blocking — delivery failures never break the request creation.
     */
    private async deliverDirectRequest(request: RequestEntity): Promise<void> {
        const targetCompanyId = request.target_company_id!;
        try {
            await this.invitationRepository.create({
                requestId: request.id,
                companyId: targetCompanyId,
                tier: 1,
                score: 1
            });

            await notificationsQueue.add('rfq-match-email', {
                companyId: targetCompanyId,
                requestId: request.id
            }, { delay: 1000 });

            const notif = await new CreateNotificationUseCase().execute({
                companyId: targetCompanyId,
                typeId: NOTIFICATION_TYPE.GENERAL,
                title: 'Nueva solicitud directa',
                message: `Un comprador te solicitó una cotización de "${request.product_service}".`,
                link: `/prospects/${request.id}`,
                entityType: 'request',
                entityId: request.id,
            });
            getIO().to(`company_${targetCompanyId}`).emit('notification:new', {
                id: notif.id,
                title: notif.title,
                message: notif.message,
                link: notif.link,
                createdAt: notif.createdAt,
            });
        } catch (err) {
            logger.error(err, `Failed to deliver direct RFQ ${request.id} to company ${targetCompanyId}`);
        }
    }
}

