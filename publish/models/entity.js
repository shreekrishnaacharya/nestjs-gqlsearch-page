"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findOne = exports.findOptions = exports.findAllByPage = void 0;
const typeorm_1 = require("typeorm");
const constants_1 = require("../constants");
function findAllByPage({ repo, queryDto, sort, gqlPage, selectDto, customQuery, }) {
    return __awaiter(this, void 0, void 0, function* () {
        const options = findOptions({
            queryDto,
            sort,
            gqlPage,
            selectDto,
            customQuery,
        });
        const result = yield repo.findAndCount(options);
        const nodes = result[0];
        const totalCount = result[1];
        return _generatePageResult(nodes, totalCount, gqlPage);
    });
}
exports.findAllByPage = findAllByPage;
function findOptions({ queryDto, sort, gqlPage, selectDto, customQuery, }) {
    if (gqlPage == undefined &&
        queryDto == undefined &&
        customQuery == undefined &&
        selectDto == undefined) {
        throw new Error("One of gqlPage|queryDto|selectDto|customQuery must be defined");
    }
    let pageable = { skip: undefined, take: undefined };
    let whereCondition = { and: [], or: [] };
    let sortRaw = undefined;
    if (sort) {
        sortRaw = {};
        sort.forEach((e) => {
            if (e.field.includes(".")) {
                const list = e.field.split(".");
                const key = list.shift();
                sortRaw[key] = _gqlSort(list, e.direction);
            }
            else {
                sortRaw[e.field] = e.direction;
            }
        });
    }
    if (gqlPage) {
        pageable = {
            skip: gqlPage.offset,
            take: gqlPage.limit,
        };
    }
    const { where: whereRaw, relations, select, } = _getMetaQuery(whereCondition, customQuery, queryDto, selectDto);
    select["id"] = true;
    return {
        select,
        where: whereRaw,
        order: sortRaw,
        relations: relations,
        skip: pageable.skip,
        take: pageable.take,
    };
}
exports.findOptions = findOptions;
function findOne({ id, repo, queryDto, selectDto, customQuery, }) {
    return __awaiter(this, void 0, void 0, function* () {
        if (id == undefined &&
            queryDto == undefined &&
            customQuery == undefined &&
            selectDto == undefined) {
            throw new Error("One of id|queryDto|selectDto|customQuery must be defined");
        }
        const cQ = customQuery !== null && customQuery !== void 0 ? customQuery : [];
        if (id) {
            cQ.push({ column: "id", value: id, operation: "eq", operator: "and" });
        }
        const options = findOptions({
            queryDto,
            selectDto,
            customQuery: cQ,
        });
        return yield repo.findOne(options);
    });
}
exports.findOne = findOne;
function _generatePageResult(nodes, totalCount, pageable) {
    return __awaiter(this, void 0, void 0, function* () {
        return {
            nodes,
            totalCount,
            pageable,
        };
    });
}
function _getMetaQuery(whereConditions, conditions, whereQuery, selectDto) {
    var _a, _b;
    let relational = {};
    for (const key in whereQuery) {
        const pageSearch = Reflect.getMetadata(constants_1.SK_PAGE_SEARCH, whereQuery, key);
        if (pageSearch) {
            if ((_a = pageSearch.column) === null || _a === void 0 ? void 0 : _a.includes(".")) {
                pageSearch.is_nested = (_b = pageSearch === null || pageSearch === void 0 ? void 0 : pageSearch.is_nested) !== null && _b !== void 0 ? _b : true;
            }
            pageSearch.value = whereQuery[key];
            if (pageSearch.value.toString() == "") {
                continue;
            }
            _buildWhere(pageSearch, whereConditions);
        }
    }
    for (const skey in selectDto) {
        if (isObject(selectDto[skey])) {
            relational[skey] = _buildRelation(selectDto[skey]);
        }
    }
    conditions === null || conditions === void 0 ? void 0 : conditions.forEach((pageSearch) => {
        var _a, _b;
        if ((_a = pageSearch.column) === null || _a === void 0 ? void 0 : _a.includes(".")) {
            pageSearch.is_nested = (_b = pageSearch === null || pageSearch === void 0 ? void 0 : pageSearch.is_nested) !== null && _b !== void 0 ? _b : true;
        }
        _buildWhere(pageSearch, whereConditions);
    });
    let whereArray = [];
    whereConditions.or.forEach((element) => {
        whereArray.push(element);
    });
    if (whereArray.length == 0) {
        whereConditions.and.forEach((ele, i) => {
            whereArray[0] = Object.assign(Object.assign({}, whereArray[0]), ele);
        });
    }
    else if (whereConditions.and.length > 0) {
        let andWhere = {};
        whereConditions.and.forEach((ele, i) => {
            andWhere = Object.assign(Object.assign({}, andWhere), ele);
        });
        whereArray = whereArray.map((element, i) => {
            return Object.assign(Object.assign({}, element), andWhere);
        });
    }
    return {
        where: [...whereArray],
        relations: Object.assign({}, relational),
        select: Object.assign({}, selectDto),
    };
}
function _recursiveNestedObject(column, value) {
    if (column.length == 1) {
        const [key] = column;
        return { [key]: value };
    }
    const [key, ...rest] = column;
    return { [key]: _recursiveNestedObject(rest, value) };
}
function _buildWhere(pageSearch, whereConditions) {
    let cond = {};
    let { column, is_nested, operation, operator, value } = pageSearch;
    if (!column) {
        return whereConditions;
    }
    if (!operation && Array.isArray(value)) {
        operation = "in";
    }
    if (operation == "in" && !Array.isArray(value)) {
        value = [value];
    }
    if (operation == "between" && !Array.isArray(value)) {
        return;
    }
    if (operation == "between" && Array.isArray(value) && value.length < 2) {
        return;
    }
    if (is_nested) {
        const nested = column.split(".");
        const nestValue = _switchContition(operation !== null && operation !== void 0 ? operation : "like", value);
        cond = _recursiveNestedObject(nested, nestValue);
    }
    else {
        cond[column] = _switchContition(operation !== null && operation !== void 0 ? operation : "like", value);
    }
    whereConditions[operator !== null && operator !== void 0 ? operator : "or"].push(cond);
}
function _buildRelation(select, relation = {}) {
    let isobject = false;
    for (const skey in select) {
        if (isObject(select[skey])) {
            relation[skey] = _buildRelation(select[skey], relation);
            isobject = true;
        }
    }
    return isobject ? relation : true;
}
function _switchContition(operation, value) {
    switch (operation) {
        case "gt":
            return (0, typeorm_1.MoreThan)(value);
        case "gteq":
            return (0, typeorm_1.MoreThanOrEqual)(value);
        case "in":
            return (0, typeorm_1.In)(value);
        case "like":
            return (0, typeorm_1.Like)(`%${value}%`);
        case "lt":
            return (0, typeorm_1.LessThan)(value);
        case "lteq":
            return (0, typeorm_1.LessThanOrEqual)(value);
        case "neq":
            return (0, typeorm_1.Not)((0, typeorm_1.Equal)(value));
        case "between":
            return (0, typeorm_1.Between)(value[0], value[1]);
        default:
            return value;
    }
}
function _gqlSort(sort, value) {
    const key = sort.shift();
    if (sort.length == 0) {
        return {
            [key]: value,
        };
    }
    return {
        [key]: _gqlSort(sort, value),
    };
}
function isObject(value) {
    return value && typeof value === "object" && !Array.isArray(value);
}
