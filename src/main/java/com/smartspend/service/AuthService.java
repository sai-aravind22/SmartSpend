package com.smartspend.service;

import com.smartspend.dto.AuthResponse;
import com.smartspend.dto.LoginRequest;
import com.smartspend.dto.RegisterRequest;
import com.smartspend.dto.UserProfileResponse;
import com.smartspend.entity.User;
import com.smartspend.exception.BadRequestException;
import com.smartspend.exception.DuplicateResourceException;
import com.smartspend.repository.UserRepository;
import com.smartspend.security.JwtUtil;
import com.smartspend.security.SecurityUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("An account with this email already exists: " + email);
        }

        String encodedPassword = passwordEncoder.encode(request.getPassword());
        User user = new User(request.getFullName().trim(), email, encodedPassword);
        User saved = userRepository.save(user);

        String token = jwtUtil.generateToken(saved.getEmail(), saved.getId());

        return new AuthResponse(token, saved.getId(), saved.getFullName(), saved.getEmail(), "Registration successful");
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Invalid email or password."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadRequestException("Invalid email or password.");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getId());

        return new AuthResponse(token, user.getId(), user.getFullName(), user.getEmail(), "Login successful");
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUserProfile() {
        User user = SecurityUtils.getCurrentUser();
        return UserProfileResponse.fromEntity(user);
    }
}
