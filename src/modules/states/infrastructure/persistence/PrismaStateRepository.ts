import { prisma } from "../../../../shared/infrastructure/database";
import { State } from "../../domain/entities/state.entity";
import { StateRepository } from "../../domain/repositories/state.repository";

export class PrismaStateRepository implements StateRepository {
    async listByCountryId(country_id: number): Promise<State[]> {
        const items = await prisma.state.findMany({
            where: { country_id, is_active: true },
            orderBy: { name: "asc" },
        });

        return items.map((item) => this.mapToEntity(item));
    }

    async findAll(filters?: { country_id?: number }): Promise<State[]> {
        const items = await prisma.state.findMany({
            where: filters || {},
            orderBy: { name: "asc" },
        });

        return items.map((item) => this.mapToEntity(item));
    }

    async findById(id: number): Promise<State | null> {
        const item = await prisma.state.findUnique({
            where: { id }
        });
        if (!item) return null;
        return this.mapToEntity(item);
    }

    async create(data: Partial<State>): Promise<State> {
        const item = await prisma.state.create({
            data: data as any
        });
        return this.mapToEntity(item);
    }

    async update(id: number, data: Partial<State>): Promise<State> {
        const item = await prisma.state.update({
            where: { id },
            data: data as any
        });
        return this.mapToEntity(item);
    }

    private mapToEntity(db: any): State {
        return new State(
            db.id,
            db.country_id,
            db.name,
            db.code ?? null,
            db.is_active ?? true
        );
    }
}
