import { ContactRepository } from "../../domain/repositories/contact.repository";
import { CompanyContact } from "../../domain/entities/contact.entity";
import { prisma } from '../../../../shared/infrastructure/database';

export class PrismaContactRepository implements ContactRepository {
    async create(contact: Partial<CompanyContact>): Promise<CompanyContact> {
        const created = await prisma.companyContact.create({
            data: {
                company_id: contact.company_id!,
                contact_person: contact.full_name ?? null,
                position: contact.position ?? null,
                whatsapp: contact.whatsapp ?? null,
                corporate_email: contact.email ?? null,
                is_primary: contact.is_primary ?? false,
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
                ...(contact.full_name !== undefined && { contact_person: contact.full_name }),
                ...(contact.position !== undefined && { position: contact.position }),
                ...(contact.whatsapp !== undefined && { whatsapp: contact.whatsapp }),
                ...(contact.email !== undefined && { corporate_email: contact.email }),
                ...(contact.is_primary !== undefined && { is_primary: contact.is_primary }),
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
            db.contact_person,
            db.position,
            db.whatsapp,
            db.corporate_email,
            db.is_primary
        );
    }
}
