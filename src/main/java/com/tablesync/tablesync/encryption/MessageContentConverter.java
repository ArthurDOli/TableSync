package com.tablesync.tablesync.encryption;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
@Converter
@Slf4j
public class MessageContentConverter implements AttributeConverter<String, String> {
    private final EncryptionService encryptionService;

    @Autowired
    public MessageContentConverter(EncryptionService encryptionService) {
        this.encryptionService = encryptionService;
    }

    @Override
    public String convertToDatabaseColumn(String plaintext) {
        if (plaintext == null) {
            return null;
        }
        try {
            return encryptionService.encrypt(plaintext);
        } catch (Exception e) {
            log.error("Failed to encrypt message before saving to DB.");
            throw new RuntimeException("Message encryption failed. Cannot save to database.", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String ciphertext) {
        if (ciphertext == null) {
            return null;
        }
        try {
            return encryptionService.decrypt(ciphertext);
        } catch (Exception e) {
            log.error("Failed to decrypt message from DB. Possible causes: key rotation or corrupted data.");
            return "[DECRYPTION_FAILED: This message cannot be decrypted.]";
        }
    }
}