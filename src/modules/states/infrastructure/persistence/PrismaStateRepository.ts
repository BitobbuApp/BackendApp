import { prisma } from "../../../../shared/infrastructure/database";
import { State } from "../../domain/entities/state.entity";
import { StateRepository } from "../../domain/repositories/state.repository";

export class PrismaStateRepository implements StateRepository {
    async listByCountryId(country_id: number): Promise<State[]> {
        const items = await prisma.state.findMany({
            where: { country_id },
            orderBy: { name: "asc" },
        });

        return items.map((item) => this.mapToEntity(item));
    }

    private mapToEntity(db: any): State {
        return new State(
            db.id,
            db.country_id,
            db.name,
            db.code ?? null,
        );
    }
}
