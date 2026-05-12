import Joi from 'joi';
import { UseCase } from '../../../shared/application/useCase';
import { PrismaRequestInvitationRepository } from '../infrastructure/persistence/PrismaRequestInvitationRepository';
import { RequestInvitationRepository } from '../domain/repositories/requestInvitation.repository';
import { PrismaCompanyRepository } from '../../companies/infrastructure/persistence/PrismaCompanyRepository';
import { CompanyRepository } from '../../companies/domain/repositories/company.repository';
import { PrismaRequestRepository } from '../infrastructure/persistence/PrismaRequestRepository';
import { RequestRepository } from '../domain/repositories/request.repository';
import { notificationsQueue } from '../../../shared/infrastructure/queue/index.queue';

interface MatchInput { rfqId: string; }

export class MatchRfqToSuppliersUseCase extends UseCase<MatchInput, void> {
    protected inputSchema = Joi.object({ rfqId: Joi.string().uuid().required() });
    protected outputSchema = Joi.any();

    private readonly invitationRepo: RequestInvitationRepository;
    private readonly companyRepo: CompanyRepository;
    private readonly requestRepo: RequestRepository;

    constructor() {
        super();
        this.invitationRepo = new PrismaRequestInvitationRepository();
        this.companyRepo = new PrismaCompanyRepository();
        this.requestRepo = new PrismaRequestRepository();
    }

    protected async implementation(data: MatchInput): Promise<void> {
        // 1. Fetch Request by data.rfqId to get categoryId, location, etc.
        const request = await this.requestRepo.findById(data.rfqId);
        if (!request) {
            console.error(`Request not found: ${data.rfqId}`);
            return;
        }

        // 2. Fetch all Companies with active offers in that categoryId
        // To simplify, we'll fetch companies that can_sell and map them. In real world, we'd query by categories_of_interest or offers.
        // Actually, let's use list on CompanyRepository.
        // The instructions say "Filters strictly by categoryId".
        // Let's assume we can filter companies by their categories_of_interest matching the request's category_id,
        // or by offers. For MVP, we'll filter by categories_of_interest.

        let candidates: any[] = [];
        if (request.category_id) {
            // Using the raw Prisma access here isn't strictly correct for UseCases,
            // but CompanyRepository list accepts filters. Let's try passing Prisma-like filters if it supports it.
            // Wait, looking at CompanyRepository list, it accepts `filters?: any`. Let's pass the correct prisma filter.
            const filters: any = {
                can_sell: true,
                id: { not: request.company_id },
                categories_of_interest: {
                    some: {
                        category_id: request.category_id
                    }
                }
            };
            // Fetch up to 1000 candidates to rank.
            const result = await this.companyRepo.list(filters, 1, 1000);
            candidates = result.data;
        }

        if (candidates.length === 0) {
            console.log(`No matching suppliers found for RFQ: ${data.rfqId}`);
            return;
        }

        // 3. Score candidates (MVP simplified)
        const scoredCandidates = candidates.map(supplier => {
            let score = 0;

            // Check state/country match against request locations.
            // A request might have state_id/country_id directly.
            // Supplier locations: supplier.locations is an array of CompanyLocation.
            const mainLocation = supplier.locations?.find((l: any) => l.is_main_headquarters) || supplier.locations?.[0];

            if (mainLocation) {
                if (mainLocation.state_id === request.state_id) score += 0.35;
                else if (mainLocation.country_id === request.country_id) score += 0.175;
            }

            // Check Plan Tier. For MVP, assume it's stored in some property, let's say company_type_id or maybe just 0.
            // if (supplier.planTier === 'Pro') score += 0.10; // Left commented per instructions logic

            return {
                companyId: supplier.id,
                score
            };
        });

        // 4. Sort descending
        scoredCandidates.sort((a, b) => b.score - a.score);

        // 5. Tier Allocation
        const finalCandidates = scoredCandidates.map((candidate, index) => {
            let tier = 2;
            if (scoredCandidates.length <= 10) {
                // all are tier 1
                tier = 1;
            } else {
                // top 10 are tier 1, rest tier 2 (capped at 40)
                if (index < 10) {
                    tier = 1;
                }
            }
            return {
                ...candidate,
                tier
            };
        }).slice(0, 40); // Capped at 40

        // 6. Create RequestInvitation records via this.invitationRepo
        for (const candidate of finalCandidates) {
            await this.invitationRepo.create({
                requestId: request.id,
                companyId: candidate.companyId,
                tier: candidate.tier,
                score: candidate.score
            });
            
            // Enqueue email notification
            await notificationsQueue.add('rfq-match-email', {
                companyId: candidate.companyId,
                requestId: request.id
            }, { delay: 1000 });
        }

        console.log(`Created ${finalCandidates.length} invitations for RFQ ${request.id}`);
    }
}
