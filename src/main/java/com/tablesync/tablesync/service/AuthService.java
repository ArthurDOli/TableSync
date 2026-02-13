package com.tablesync.tablesync.service;

import com.tablesync.tablesync.dto.auth.request.LoginRequest;
import com.tablesync.tablesync.dto.auth.request.RegisterRequest;
import com.tablesync.tablesync.dto.auth.response.AuthResponse;
import com.tablesync.tablesync.entity.User;
import com.tablesync.tablesync.exception.DuplicateResourceException;
import com.tablesync.tablesync.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Attempting to register user: {}", request.getEmail());

        verifyEmailDuplication(request.getEmail());

        User user = buildUserEntity(request);
        User savedUser = userRepository.save(user);

        String jwtToken = jwtService.generateToken(savedUser);

        log.info("User registered successfully: {}", savedUser.getEmail());
        return buildAuthResponse(savedUser, jwtToken);
    }

    @Transactional(readOnly = true)
    public AuthResponse authenticate(LoginRequest request) {
        log.info("Authentication attempt for user: {}", request.getEmail());

        authenticateInSpring(request.getEmail(), request.getPassword());

        User user = findUserByEmail(request.getEmail());
        String jwtToken = jwtService.generateToken(user);

        log.info("User authenticated successfully: {}", request.getEmail());
        return buildAuthResponse(user, jwtToken);
    }

    private void verifyEmailDuplication(String email) {
        if (userRepository.existsByEmail(email)) {
            log.warn("Registration attempt with existing email: {}", email);
            throw new DuplicateResourceException("User", "email", email);
        }
    }

    private User buildUserEntity(RegisterRequest request) {
        return User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .build();
    }

    private void authenticateInSpring(String email, String password) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password)
        );
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    private AuthResponse buildAuthResponse(User user, String token) {
        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .user(AuthResponse.UserInfo.builder()
                        .id(user.getId())
                        .username(user.getRealUsername())
                        .email(user.getEmail())
                        .role(user.getRole().name())
                        .build())
                .build();
    }
}
