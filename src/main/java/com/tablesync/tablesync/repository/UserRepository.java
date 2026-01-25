package com.tablesync.tablesync.repository;

import com.tablesync.tablesync.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean findByUsername(String username);
    boolean existsByEmail(String email);
}
