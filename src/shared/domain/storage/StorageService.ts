export interface UploadUrlResponse {
    presignedUrl: string;
    fileKey: string;
}

export interface StorageService {
    /**
     * Generates a secure, time-limited URL for direct client-to-bucket uploads.
     *
     * @param tenantId The ID of the tenant (company).
     * @param rfqId The ID of the RFQ.
     * @param originalFileName The original name of the file to be uploaded.
     * @param mimeType The MIME type of the file.
     * @returns A promise that resolves to an object containing the presigned URL and the generated unique file key.
     * @throws {StorageServiceException} If there's an error generating the URL.
     */
    generateUploadPresignedUrl(
        tenantId: string,
        rfqId: string,
        originalFileName: string,
        mimeType: string
    ): Promise<UploadUrlResponse>;

    /**
     * Generates a secure, time-limited URL for downloading private documents.
     *
     * @param fileKey The full S3 key of the file to download.
     * @returns A promise that resolves to the presigned URL string.
     * @throws {StorageServiceException} If there's an error generating the URL.
     */
    generateDownloadPresignedUrl(fileKey: string): Promise<string>;

    /**
     * Deletes a document from the storage.
     *
     * @param fileKey The full S3 key of the file to delete.
     * @returns A promise that resolves when the file is successfully deleted.
     * @throws {StorageServiceException} If there's an error deleting the file.
     */
    deleteDocument(fileKey: string): Promise<void>;
}
