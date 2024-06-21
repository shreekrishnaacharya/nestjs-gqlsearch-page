"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GqlFields = exports.SelectColumn = exports.PageSearch = void 0;
const constants_1 = require("../constants");
const common_1 = require("@nestjs/common");
const graphql_1 = require("@nestjs/graphql");
function PageSearch(options) {
    return (target, propertyKey) => {
        const optionsList = Object.assign({ column: propertyKey, is_nested: false, operation: "like", operator: "or", value: null }, options);
        Reflect.defineMetadata(constants_1.SK_PAGE_SEARCH, optionsList, target, propertyKey);
    };
}
exports.PageSearch = PageSearch;
function SelectColumn(options) {
    return (target, propertyKey) => {
        const optionsList = Object.assign({ column: propertyKey }, options);
        Reflect.defineMetadata(constants_1.SK_IS_SELECT, optionsList, target, propertyKey);
    };
}
exports.SelectColumn = SelectColumn;
exports.GqlFields = (0, common_1.createParamDecorator)((data, ctx) => {
    const gqlCtx = graphql_1.GqlExecutionContext.create(ctx);
    const info = gqlCtx.getInfo();
    const node = info.fieldNodes[0];
    return getNodeData(node);
});
const getNodeData = (node) => {
    const { selectionSet } = node || {};
    let fields = null;
    if (!!selectionSet) {
        fields = {};
        selectionSet.selections.forEach((selection) => {
            const name = selection.name.value;
            fields[name] = getNodeData(selection);
        });
    }
    return fields == null ? true : fields;
};
