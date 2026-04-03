import Joi from "joi";
import { UseCase } from "../../../shared/application/useCase";
import { listNotificationTypesDtoResponseSchema } from "./dtos/notificationType.dto";
import { NotificationTypeRepository } from "../domain/repositories/notificationType.repository";
import { PrismaNotificationTypeRepository } from "../infrastructure/persistence/PrismaNotificationTypeRepository";

export class ListNotificationTypesUseCase extends UseCase<Record<string, never>, any> {
    protected inputSchema: Joi.Schema = Joi.object({});
    protected outputSchema: Joi.Schema = listNotificationTypesDtoResponseSchema;
    private readonly notificationTypeRepository: NotificationTypeRepository;

    constructor() {
        super();
        this.notificationTypeRepository = new PrismaNotificationTypeRepository();
    }

    protected async implementation(): Promise<any> {
        return await this.notificationTypeRepository.list();
    }
}
