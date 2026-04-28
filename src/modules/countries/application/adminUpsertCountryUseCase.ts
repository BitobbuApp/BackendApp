import { UseCase } from "../../../shared/application/useCase";
import { CountryRepository } from "../domain/repositories/country.repository";
import { PrismaCountryRepository } from "../infrastructure/persistence/PrismaCountryRepository";
import { adminUpsertCountryInputSchema, countryDtoResponseSchema } from "./dtos/country.dto";
import { ApplicationError } from "../../../shared/domain/error";

export class AdminUpsertCountryUseCase extends UseCase<any, any> {
    protected inputSchema = adminUpsertCountryInputSchema;
    protected outputSchema = countryDtoResponseSchema;
    private readonly countryRepository: CountryRepository;

    constructor(countryRepository?: CountryRepository) {
        super();
        this.countryRepository = countryRepository || new PrismaCountryRepository();
    }

    protected async implementation(input: { id?: number, data: any }): Promise<any> {
        const { id, data } = input;

        if (id) {
            const exists = await this.countryRepository.findById(id);
            if (!exists) {
                throw new ApplicationError(404, "Country not found");
            }
            return await this.countryRepository.update(id, data);
        } else {
            return await this.countryRepository.create(data);
        }
    }
}
