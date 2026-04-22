import Joi from "joi";
import { UseCase } from "../../../shared/application/useCase";
import { RequestRepository } from "../domain/repositories/request.repository";
import { PrismaRequestRepository } from "../infrastructure/persistence/PrismaRequestRepository";
import { createRequestDtoRequestSchema, requestDtoResponseSchema } from "./dtos/request.dto";
import { RFQ_TYPE } from "../../../shared/constants/request/request.contants";
import { storageService } from "../../../shared/infrastructure/storage/storageInstance";
import { UploadDocumentUseCase } from "../../documents/application/UploadDocumentUseCase";

interface CreateRequestDto {
    company_id: string;
    product_service: string;
    quantity: number;
    user_id?: string | null;
    unit_id?: number;
    description?: string | null;
    category_id?: number | null;
    status?: string;
    type: number;
    payment_condition_id?: string | null;
    country_id?: number | null;
    state_id?: number | null;
    city_id?: number | null;
    reach_service?: string | null;
    expiration_date?: Date | null;
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

    constructor() {
        super();
        this.requestRepository = new PrismaRequestRepository();
        this.uploadDocumentUseCase = new UploadDocumentUseCase(storageService);
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

        const created = await this.requestRepository.create(repoData as any);
        return {
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
}

