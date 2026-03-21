package com.tablesync.tablesync.encryption;

import com.google.crypto.tink.Aead;
import com.google.crypto.tink.InsecureSecretKeyAccess;
import com.google.crypto.tink.KeysetHandle;
import com.google.crypto.tink.TinkJsonProtoKeysetFormat;
import com.google.crypto.tink.aead.AeadConfig;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.Base64;

@Service
@Slf4j
public class EncryptionService {
    private Aead aead;

    @Value("${encryption.aes-key:}")
    private String base64key;

    @PostConstruct
    public void init() {
        try {
            AeadConfig.register();

            if (base64key != null && !base64key.isEmpty()) {
                KeysetHandle keysetHandle = TinkJsonProtoKeysetFormat.parseKeyset(
                        base64key,
                        InsecureSecretKeyAccess.get()
                );
                this.aead = keysetHandle.getPrimitive(Aead.class);
                log.info("EncryptionService initialized with key from environment");
            } else {
                log.warn("ENCRYPTION_AES_KEY not set — chat messages will be stored as plaintext");
            }
        } catch (GeneralSecurityException e) {
            log.error("Failed to initialize encryption service", e);
            throw new RuntimeException("Encryption initialization failed", e);
        }
    }

    public String encrypt(String plaintext) {
        if (aead == null || plaintext == null || plaintext.isEmpty()) {
            return plaintext;
        }
        try {
            byte[] ciphertext = aead.encrypt(plaintext.getBytes(StandardCharsets.UTF_8), null);
            return Base64.getEncoder().encodeToString(ciphertext);
        } catch (GeneralSecurityException e) {
            log.error("Encryption failed");
            throw new RuntimeException("Failed to encrypt message", e);
        }
    }

    public String decrypt(String ciphertext) {
        if (aead == null || ciphertext == null || ciphertext.isEmpty()) {
            return ciphertext;
        }
        try {
            byte[] ciphertextBytes = Base64.getDecoder().decode(ciphertext);
            byte[] plaintextBytes = aead.decrypt(ciphertextBytes, null);
            return new String(plaintextBytes, StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            log.error("Invalid Base64 ciphertext");
            throw new RuntimeException("Failed to decode ciphertext", e);
        } catch (GeneralSecurityException e) {
            log.error("Decryption failed — wrong key, tampered or corrupted data");
            throw new RuntimeException("Failed to decrypt message", e);
        }
    }
}