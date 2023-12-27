export class RegexBuilder {
    static searchByName(text: string) {
        return new RegExp(text, "i");
    }
}