---
name: agent-skill # Bắt buộc, tối đa 64 ký tự, chỉ chữ thường/số/gạch ngang
description: This skill allows the agent to perform actions and interact with external systems or APIs. # Bắt buộc, tối đa 1024 ký tự
allowed-tools: [Read, Glob, Grep] # Tùy chọn - giới hạn tools được dùng
disable-model-invocation: false # Tùy chọn - nếu true = chỉ gọi thủ công
user-invocable: true # Tùy chọn - nếu false = ẩn khỏi menu
context: fork # Tùy chọn - chạy trong context riêng
agent: Explore # Tùy chọn - dùng với context: fork
model: sonnet # Tùy chọn - model cụ thể
---
