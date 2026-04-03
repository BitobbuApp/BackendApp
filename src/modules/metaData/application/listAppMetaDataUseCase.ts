import Joi from "joi";
import { UseCase } from "../../../shared/application/useCase";
import { listAppMetaDataDtoResponseSchema } from "./dtos/metaData.dto";
import { ListCategoriesUseCase } from "../../categories/application/listCategoriesUseCase";
import { ListCompanyTypesUseCase } from "../../companyTypes/application/listCompanyTypesUseCase";
import { ListNotificationTypesUseCase } from "../../notificationTypes/application/listNotificationTypesUseCase";
import { ListPaymentMethodsUseCase } from "../../paymentMethods/application/listPaymentMethodsUseCase";
import { ListUnitsOfMeasureUseCase } from "../../unitsOfMeasure/application/listUnitsOfMeasureUseCase";
import { ListVerifDocTypesUseCase } from "../../verifDocTypes/application/listVerifDocTypesUseCase";

interface ListAppMetaDataOutput {
    categories: any[];
    company_types: any[];
    notification_types: any[];
    payment_methods: any[];
    units_of_measure: any[];
    verif_doc_types: any[];
}

export class ListAppMetaDataUseCase extends UseCase<Record<string, never>, ListAppMetaDataOutput> {
    protected inputSchema: Joi.Schema = Joi.object({});
    protected outputSchema: Joi.Schema = listAppMetaDataDtoResponseSchema;
    private readonly listCategoriesUseCase: ListCategoriesUseCase;
    private readonly listCompanyTypesUseCase: ListCompanyTypesUseCase;
    private readonly listNotificationTypesUseCase: ListNotificationTypesUseCase;
    private readonly listPaymentMethodsUseCase: ListPaymentMethodsUseCase;
    private readonly listUnitsOfMeasureUseCase: ListUnitsOfMeasureUseCase;
    private readonly listVerifDocTypesUseCase: ListVerifDocTypesUseCase;

    constructor() {
        super();
        this.listCategoriesUseCase = new ListCategoriesUseCase();
        this.listCompanyTypesUseCase = new ListCompanyTypesUseCase();
        this.listNotificationTypesUseCase = new ListNotificationTypesUseCase();
        this.listPaymentMethodsUseCase = new ListPaymentMethodsUseCase();
        this.listUnitsOfMeasureUseCase = new ListUnitsOfMeasureUseCase();
        this.listVerifDocTypesUseCase = new ListVerifDocTypesUseCase();
    }

    protected async implementation(): Promise<ListAppMetaDataOutput> {
        const [
            categories,
            companyTypes,
            notificationTypes,
            paymentMethods,
            unitsOfMeasure,
            verifDocTypes,
        ] = await Promise.all([
            this.listCategoriesUseCase.execute({}),
            this.listCompanyTypesUseCase.execute({}),
            this.listNotificationTypesUseCase.execute({}),
            this.listPaymentMethodsUseCase.execute({}),
            this.listUnitsOfMeasureUseCase.execute({}),
            this.listVerifDocTypesUseCase.execute({}),
        ]);

        return {
            categories,
            company_types: companyTypes,
            notification_types: notificationTypes,
            payment_methods: paymentMethods,
            units_of_measure: unitsOfMeasure,
            verif_doc_types: verifDocTypes,
        };
    }
}
