import { FastifyRequest, FastifyReply } from 'fastify';

export async function multipartParserMiddleware(request: any, reply: FastifyReply) {
    if (!request.isMultipart()) {
        return;
    }

    let body: any = {};
    const files: Array<{ file_name: string; buffer: Buffer; mime_type: string }> = [];

    for await (const part of request.parts()) {
        if (part.type === 'file') {
            const buffer = await part.toBuffer();
            if (buffer.length > 0) {
                files.push({
                    file_name: part.filename,
                    buffer,
                    mime_type: part.mimetype
                });
            }
        } else if (part.fieldname === 'payload') {
            // Main JSON payload comes as a single stringified field
            body = JSON.parse(part.value as string);
        } else {
            body[part.fieldname] = part.value;
        }
    }

    request.body = body;
    request.uploadedFiles = files;
}
