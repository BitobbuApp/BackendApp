import { ContactRepository } from "../../domain/repositories/contact.repository";
import { CompanyContact } from "../../domain/entities/contact.entity";
import { prisma } from '../../../../shared/infrastructure/database';

export class PrismaContactRepository implements ContactRepository {
    async create(contact: Partial<CompanyContact>): Promise<CompanyContact> {
        const created = await prisma.companyContact.create({
            data: {
                company_id: contact.company_id!,
                full_name: contact.full_name!,
                position: contact.position,
                whatsapp: contact.whatsapp,
                email: contact.email,
                is_primary: contact.is_primary,
            }
        });
        return this.mapToEntity(created);
    }

    async findById(id: string): Promise<CompanyContact | null> {
        const found = await prisma.companyContact.findUnique({ where: { id } });
        if (!found) return null;
        return this.mapToEntity(found);
    }

    async findByCompanyId(companyId: string): Promise<CompanyContact[]> {
        const list = await prisma.companyContact.findMany({ where: { company_id: companyId } });
        return list.map((item: any) => this.mapToEntity(item));
    }

    async update(id: string, contact: Partial<CompanyContact>): Promise<CompanyContact> {
        const updated = await prisma.companyContact.update({
            where: { id },
            data: {
                full_name: contact.full_name,
                position: contact.position,
                whatsapp: contact.whatsapp,
                email: contact.email,
                is_primary: contact.is_primary,
            }
        });
        return this.mapToEntity(updated);
    }

    async delete(id: string): Promise<void> {
        await prisma.companyContact.delete({ where: { id } });
    }

    async resetPrimaryContacts(companyId: string): Promise<void> {
        await prisma.companyContact.updateMany({
            where: { company_id: companyId },
            data: { is_primary: false }
        });
    }

    private mapToEntity(db: any): CompanyContact {
        return new CompanyContact(
            db.id,
            db.company_id,
            db.full_name,
            db.position,
            db.whatsapp,
            db.email,
            db.is_primary
        );
    }
}
