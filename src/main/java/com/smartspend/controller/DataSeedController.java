package com.smartspend.controller;

import com.smartspend.dto.ApiResponse;
import com.smartspend.service.DataSeedService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/seed")
@CrossOrigin(origins = "*")
public class DataSeedController {

    private final DataSeedService dataSeedService;

    public DataSeedController(DataSeedService dataSeedService) {
        this.dataSeedService = dataSeedService;
    }

    @PostMapping("/reset")
    public ResponseEntity<ApiResponse<String>> resetData() {
        dataSeedService.resetData();
        return ResponseEntity.ok(ApiResponse.ok("Sample demo data has been reset successfully."));
    }
}
