CREATE DATABASE IF NOT EXISTS techcart;
USE techcart;

CREATE TABLE IF NOT EXISTS customers (
    customer_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(32),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    product_sku VARCHAR(64) PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    category VARCHAR(128),
    dimensions VARCHAR(255),
    weight VARCHAR(128),
    connectivity TEXT,
    battery TEXT,
    display_specs TEXT,
    warranty_months INT DEFAULT 12,
    warranty_terms TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    order_id VARCHAR(64) PRIMARY KEY,
    customer_id VARCHAR(64) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(64),
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'shipped', 'delivered', 'returned', 'cancelled') NOT NULL DEFAULT 'pending',
    tracking_number VARCHAR(128),
    carrier VARCHAR(128),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_orders_customer (customer_id),
    INDEX idx_orders_sku (product_sku),
    CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    CONSTRAINT fk_orders_product FOREIGN KEY (product_sku) REFERENCES products(product_sku)
);

CREATE TABLE IF NOT EXISTS invoices (
    invoice_id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL,
    customer_id VARCHAR(64) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(8) NOT NULL DEFAULT 'USD',
    status ENUM('paid', 'unpaid', 'refunded', 'disputed') NOT NULL DEFAULT 'unpaid',
    payment_method VARCHAR(128),
    dispute_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_invoices_customer (customer_id),
    CONSTRAINT fk_invoices_order FOREIGN KEY (order_id) REFERENCES orders(order_id),
    CONSTRAINT fk_invoices_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

CREATE TABLE IF NOT EXISTS conversations (
    conversation_id VARCHAR(64) PRIMARY KEY,
    customer_id VARCHAR(64) NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    triage_result VARCHAR(64),
    resolved BOOLEAN DEFAULT FALSE,
    INDEX idx_conversations_customer (customer_id),
    CONSTRAINT fk_conversations_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

CREATE TABLE IF NOT EXISTS messages (
    message_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id VARCHAR(64) NOT NULL,
    role ENUM('user', 'assistant', 'tool', 'system') NOT NULL,
    content TEXT NOT NULL,
    agent_name VARCHAR(128),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_messages_conversation (conversation_id),
    CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id)
);

CREATE TABLE IF NOT EXISTS returns (
    return_authorization_number VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL,
    customer_id VARCHAR(64) NOT NULL,
    reason ENUM('damaged', 'wrong_item', 'changed_mind', 'defective') NOT NULL,
    item_condition VARCHAR(255),
    status ENUM('requested', 'approved', 'in_transit', 'received', 'completed', 'rejected') NOT NULL DEFAULT 'requested',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_returns_order (order_id),
    CONSTRAINT fk_returns_order FOREIGN KEY (order_id) REFERENCES orders(order_id),
    CONSTRAINT fk_returns_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

CREATE TABLE IF NOT EXISTS token_usage_logs (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id VARCHAR(64),
    agent_name VARCHAR(128),
    model_name VARCHAR(128),
    input_tokens INT DEFAULT 0,
    output_tokens INT DEFAULT 0,
    estimated_cost_usd DECIMAL(12, 8) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token_conversation (conversation_id)
);

CREATE TABLE IF NOT EXISTS evaluation_logs (
    eval_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id VARCHAR(64) NOT NULL,
    routing_accuracy_score INT NOT NULL,
    tool_precision_score INT NOT NULL,
    response_quality_score INT NOT NULL,
    judge_reasoning TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_eval_conversation (conversation_id),
    CONSTRAINT fk_eval_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id)
);
