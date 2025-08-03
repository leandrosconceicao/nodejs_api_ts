import mongoose from 'mongoose';

interface MongoId {
    prototype?: mongoose.Types.ObjectId;
    cacheHexString?: unknown;
    generate?: {};
    createFromTime?: {};
    createFromHexString?: {};
    createFromBase64?: {};
    isValid?: {};
}

export default MongoId;