import ValidatorInfo from "../models/ValidationInfo";

export class Validators {
    field: string;
    value: any;
    type?: string;
    constructor(field: string, value: any, type?: string) {
        this.field = field;
        this.value = value;
        this.type = type;
    }

    validate() : ValidatorInfo {
        if (!this.value) {
            return {parameter: this.field, value: this.value, isValid: false,};
        }
        if (this.type) {
            const type = typeof this.value;
            const valid = type === this.type;
            return {parameter: this.field, value: this.value, isValid: valid, info: valid ? null : ` precisa ser do tipo ${this.type}, tipo informado [${type}]`}
        }
        return {parameter: this.field, value: this.value, isValid: true};
    }


}