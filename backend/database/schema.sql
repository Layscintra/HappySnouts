-- MariaDB dump 10.19-12.2.2-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: happysnouts
-- ------------------------------------------------------
-- Server version	12.2.2-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Current Database: `happysnouts`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `happysnouts` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;

USE `happysnouts`;

--
-- Table structure for table `carrinho`
--

DROP TABLE IF EXISTS `carrinho`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `carrinho` (
  `id_carrinho` int(11) NOT NULL AUTO_INCREMENT,
  `id_endereco` int(11) DEFAULT NULL,
  `id_usuario` int(11) NOT NULL,
  `cep_entrega` varchar(9) DEFAULT NULL,
  `valor_frete` decimal(10,2) DEFAULT NULL,
  `tipo_entrega` enum('rapida','normal') DEFAULT NULL,
  `data_criacao` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id_carrinho`),
  UNIQUE KEY `id_usuario` (`id_usuario`),
  KEY `id_endereco` (`id_endereco`),
  CONSTRAINT `1` FOREIGN KEY (`id_endereco`) REFERENCES `enderecos_usuario` (`id_endereco`),
  CONSTRAINT `2` FOREIGN KEY (`id_usuario`) REFERENCES `clientes` (`Id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cartoes`
--

DROP TABLE IF EXISTS `cartoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cartoes` (
  `id_cartao` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `icone` varchar(20) DEFAULT NULL,
  `destinatario` varchar(100) NOT NULL,
  `ultimos_digitos` char(4) NOT NULL,
  `nome_titular` varchar(100) DEFAULT NULL,
  `padrao` tinyint(1) DEFAULT 0,
  `data_criacao` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id_cartao`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `1` FOREIGN KEY (`id_usuario`) REFERENCES `clientes` (`Id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `categorias_blog`
--

DROP TABLE IF EXISTS `categorias_blog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `categorias_blog` (
  `id_categoria` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(50) NOT NULL,
  `cor` varchar(7) DEFAULT NULL,
  `icone` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id_categoria`),
  UNIQUE KEY `nome` (`nome`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `categorias_produto`
--

DROP TABLE IF EXISTS `categorias_produto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `categorias_produto` (
  `id_categoria` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(50) NOT NULL,
  `icone` varchar(100) DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id_categoria`),
  UNIQUE KEY `nome` (`nome`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `clientes`
--

DROP TABLE IF EXISTS `clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientes` (
  `Id_usuario` int(11) NOT NULL AUTO_INCREMENT,
  `nome_completo` varchar(100) NOT NULL,
  `nome_usuario` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `cpf` varchar(11) DEFAULT NULL,
  `telefone` varchar(15) DEFAULT NULL,
  `data_nascimento` date DEFAULT NULL,
  `senha_hash` varchar(255) DEFAULT NULL,
  `Id_google` varchar(255) DEFAULT NULL,
  `tipo_login` enum('local','google') NOT NULL DEFAULT 'local',
  `data_cadastro` datetime DEFAULT current_timestamp(),
  `foto_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`Id_usuario`),
  UNIQUE KEY `nome_usuario` (`nome_usuario`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `cpf` (`cpf`),
  UNIQUE KEY `Id_google` (`Id_google`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `comentarios_blog`
--

DROP TABLE IF EXISTS `comentarios_blog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `comentarios_blog` (
  `id_comentario` int(11) NOT NULL AUTO_INCREMENT,
  `id_post` int(11) NOT NULL,
  `id_autor` int(11) DEFAULT NULL,
  `autor_nome` varchar(120) DEFAULT NULL,
  `texto` varchar(1000) NOT NULL,
  `data_comentario` datetime NOT NULL DEFAULT current_timestamp(),
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id_comentario`),
  KEY `idx_comentarios_post` (`id_post`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `curtidas_comentario_blog`
--

DROP TABLE IF EXISTS `curtidas_comentario_blog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `curtidas_comentario_blog` (
  `id_comentario` int(11) NOT NULL,
  `id_cliente` int(11) NOT NULL,
  `data_curtida` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_comentario`,`id_cliente`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `curtidas_post_blog`
--

DROP TABLE IF EXISTS `curtidas_post_blog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `curtidas_post_blog` (
  `id_post` int(11) NOT NULL,
  `id_cliente` int(11) NOT NULL,
  `data_curtida` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_post`,`id_cliente`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `enderecos_usuario`
--

DROP TABLE IF EXISTS `enderecos_usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `enderecos_usuario` (
  `id_endereco` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `cep` char(9) NOT NULL,
  `estado` char(2) NOT NULL,
  `cidade` varchar(100) NOT NULL,
  `bairro` varchar(100) NOT NULL,
  `endereco` varchar(150) NOT NULL,
  `numero` varchar(10) NOT NULL,
  `apelido` varchar(50) DEFAULT NULL,
  `padrao` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id_endereco`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `1` FOREIGN KEY (`id_usuario`) REFERENCES `clientes` (`Id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `favoritos`
--

DROP TABLE IF EXISTS `favoritos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `favoritos` (
  `id_favorito` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `id_produto` int(11) NOT NULL,
  PRIMARY KEY (`id_favorito`),
  UNIQUE KEY `id_usuario` (`id_usuario`,`id_produto`),
  KEY `id_produto` (`id_produto`),
  CONSTRAINT `1` FOREIGN KEY (`id_usuario`) REFERENCES `clientes` (`Id_usuario`),
  CONSTRAINT `2` FOREIGN KEY (`id_produto`) REFERENCES `produtos` (`id_produto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `formas_pagamento`
--

DROP TABLE IF EXISTS `formas_pagamento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `formas_pagamento` (
  `id_forma_pagamento` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(30) NOT NULL,
  `nome` varchar(50) NOT NULL,
  `usa_cartao` tinyint(1) NOT NULL DEFAULT 0,
  `max_parcelas` tinyint(4) NOT NULL DEFAULT 1,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id_forma_pagamento`),
  UNIQUE KEY `codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `funcionarios`
--

DROP TABLE IF EXISTS `funcionarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `funcionarios` (
  `id_funcionario` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `cargo` varchar(50) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `telefone` varchar(15) DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  `senha_hash` varchar(255) NOT NULL,
  PRIMARY KEY (`id_funcionario`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `historico_peso`
--

DROP TABLE IF EXISTS `historico_peso`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `historico_peso` (
  `id_peso` int(11) NOT NULL AUTO_INCREMENT,
  `id_pet` int(11) NOT NULL,
  `peso` decimal(6,3) NOT NULL,
  `data_registro` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_peso`),
  KEY `idx_historico_peso_pet` (`id_pet`,`data_registro`),
  CONSTRAINT `1` FOREIGN KEY (`id_pet`) REFERENCES `pets` (`id_pet`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `itens_carrinho`
--

DROP TABLE IF EXISTS `itens_carrinho`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `itens_carrinho` (
  `id_itens_carrinho` int(11) NOT NULL AUTO_INCREMENT,
  `id_carrinho` int(11) NOT NULL,
  `id_produto` int(11) NOT NULL,
  `quantidade` int(11) NOT NULL DEFAULT 1,
  `preco_unico` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id_itens_carrinho`),
  UNIQUE KEY `id_carrinho` (`id_carrinho`,`id_produto`),
  KEY `id_produto` (`id_produto`),
  CONSTRAINT `2` FOREIGN KEY (`id_carrinho`) REFERENCES `carrinho` (`id_carrinho`),
  CONSTRAINT `3` FOREIGN KEY (`id_produto`) REFERENCES `produtos` (`id_produto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `itens_pedido`
--

DROP TABLE IF EXISTS `itens_pedido`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `itens_pedido` (
  `id_item` int(11) NOT NULL AUTO_INCREMENT,
  `id_pedido` int(11) NOT NULL,
  `id_produto` int(11) NOT NULL,
  `nome_produto` varchar(150) NOT NULL,
  `imagem_url` varchar(255) DEFAULT NULL,
  `quantidade` int(11) NOT NULL,
  `preco_unico` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id_item`),
  KEY `id_pedido` (`id_pedido`),
  KEY `id_produto` (`id_produto`),
  CONSTRAINT `1` FOREIGN KEY (`id_pedido`) REFERENCES `pedidos` (`id_pedido`) ON DELETE CASCADE,
  CONSTRAINT `2` FOREIGN KEY (`id_produto`) REFERENCES `produtos` (`id_produto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lembretes`
--

DROP TABLE IF EXISTS `lembretes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `lembretes` (
  `id_lembrete` int(11) NOT NULL AUTO_INCREMENT,
  `id_pet` int(11) NOT NULL,
  `titulo` varchar(100) NOT NULL,
  `tipo` enum('remedio','banho','vacina','consulta','outro') NOT NULL,
  `cor` varchar(7) NOT NULL DEFAULT '#9E9E9E',
  `descricao` varchar(150) DEFAULT NULL,
  `data_hora` datetime NOT NULL,
  `recorrente` tinyint(1) DEFAULT 0,
  `concluido` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id_lembrete`),
  KEY `id_pet` (`id_pet`),
  CONSTRAINT `1` FOREIGN KEY (`id_pet`) REFERENCES `pets` (`id_pet`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mensagens_contato`
--

DROP TABLE IF EXISTS `mensagens_contato`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `mensagens_contato` (
  `id_mensagem` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) DEFAULT NULL,
  `nome` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `assunto` varchar(60) NOT NULL,
  `mensagem` text NOT NULL,
  `status` enum('aberta','respondida','fechada') NOT NULL DEFAULT 'aberta',
  `resposta` text DEFAULT NULL,
  `id_funcionario` int(11) DEFAULT NULL,
  `data_envio` datetime DEFAULT current_timestamp(),
  `data_resposta` datetime DEFAULT NULL,
  PRIMARY KEY (`id_mensagem`),
  KEY `idx_contato_status` (`status`),
  KEY `id_usuario` (`id_usuario`),
  KEY `id_funcionario` (`id_funcionario`),
  CONSTRAINT `1` FOREIGN KEY (`id_usuario`) REFERENCES `clientes` (`Id_usuario`) ON DELETE SET NULL,
  CONSTRAINT `2` FOREIGN KEY (`id_funcionario`) REFERENCES `funcionarios` (`id_funcionario`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notificacoes`
--

DROP TABLE IF EXISTS `notificacoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificacoes` (
  `id_notificacao` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `titulo` varchar(120) NOT NULL,
  `mensagem` varchar(500) NOT NULL,
  `tipo` varchar(30) NOT NULL DEFAULT 'geral',
  `referencia_id` int(11) DEFAULT NULL,
  `lida` tinyint(1) NOT NULL DEFAULT 0,
  `data_criacao` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id_notificacao`),
  KEY `idx_notificacoes_usuario` (`id_usuario`,`lida`),
  CONSTRAINT `1` FOREIGN KEY (`id_usuario`) REFERENCES `clientes` (`Id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pagamentos_pedido`
--

DROP TABLE IF EXISTS `pagamentos_pedido`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `pagamentos_pedido` (
  `id_pagamento` int(11) NOT NULL AUTO_INCREMENT,
  `id_pedido` int(11) NOT NULL,
  `id_forma_pagamento` int(11) NOT NULL,
  `id_cartao` int(11) DEFAULT NULL,
  `parcelas` tinyint(4) NOT NULL DEFAULT 1,
  `valor` decimal(10,2) NOT NULL,
  `status` enum('pendente','aprovado','recusado','cancelado','estornado') NOT NULL DEFAULT 'pendente',
  `pix_copia_cola` text DEFAULT NULL,
  `pix_expira_em` datetime DEFAULT NULL,
  `data_criacao` datetime DEFAULT current_timestamp(),
  `data_pagamento` datetime DEFAULT NULL,
  `data_atualizacao` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_pagamento`),
  UNIQUE KEY `uq_pagamento_pedido` (`id_pedido`),
  KEY `idx_pagamento_status` (`status`),
  KEY `fk_pagamento_forma` (`id_forma_pagamento`),
  KEY `fk_pagamento_cartao` (`id_cartao`),
  CONSTRAINT `fk_pagamento_cartao` FOREIGN KEY (`id_cartao`) REFERENCES `cartoes` (`id_cartao`) ON DELETE SET NULL,
  CONSTRAINT `fk_pagamento_forma` FOREIGN KEY (`id_forma_pagamento`) REFERENCES `formas_pagamento` (`id_forma_pagamento`),
  CONSTRAINT `fk_pagamento_pedido` FOREIGN KEY (`id_pedido`) REFERENCES `pedidos` (`id_pedido`) ON DELETE CASCADE,
  CONSTRAINT `ck_parcelas` CHECK (`parcelas` between 1 and 12)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pedido_historico`
--

DROP TABLE IF EXISTS `pedido_historico`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedido_historico` (
  `id_historico` int(11) NOT NULL AUTO_INCREMENT,
  `id_pedido` int(11) NOT NULL,
  `status` enum('recebido','em_preparacao','enviado','entregue','cancelado') NOT NULL,
  `observacao` varchar(255) DEFAULT NULL,
  `id_funcionario` int(11) DEFAULT NULL,
  `data_hora` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id_historico`),
  KEY `id_pedido` (`id_pedido`),
  KEY `id_funcionario` (`id_funcionario`),
  CONSTRAINT `1` FOREIGN KEY (`id_pedido`) REFERENCES `pedidos` (`id_pedido`) ON DELETE CASCADE,
  CONSTRAINT `2` FOREIGN KEY (`id_funcionario`) REFERENCES `funcionarios` (`id_funcionario`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pedidos`
--

DROP TABLE IF EXISTS `pedidos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedidos` (
  `id_pedido` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `status` enum('recebido','em_preparacao','enviado','entregue','cancelado') NOT NULL DEFAULT 'recebido',
  `tipo_entrega` enum('rapida','normal') NOT NULL DEFAULT 'normal',
  `subtotal` decimal(10,2) NOT NULL DEFAULT 0.00,
  `frete` decimal(10,2) NOT NULL DEFAULT 0.00,
  `desconto` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `cupom` varchar(30) DEFAULT NULL,
  `forma_pagamento` varchar(100) DEFAULT NULL,
  `cep` varchar(9) DEFAULT NULL,
  `estado` char(2) DEFAULT NULL,
  `cidade` varchar(100) DEFAULT NULL,
  `bairro` varchar(100) DEFAULT NULL,
  `endereco` varchar(150) DEFAULT NULL,
  `numero` varchar(10) DEFAULT NULL,
  `apelido` varchar(50) DEFAULT NULL,
  `codigo_rastreio` varchar(50) DEFAULT NULL,
  `data_pedido` datetime DEFAULT current_timestamp(),
  `data_atualizacao` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_pedido`),
  KEY `idx_pedidos_usuario` (`id_usuario`),
  KEY `idx_pedidos_status` (`status`),
  CONSTRAINT `1` FOREIGN KEY (`id_usuario`) REFERENCES `clientes` (`Id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pets`
--

DROP TABLE IF EXISTS `pets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `pets` (
  `id_pet` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `nome_pet` varchar(50) NOT NULL,
  `raca` varchar(100) NOT NULL,
  `idade_pet` int(11) DEFAULT NULL,
  `id_coleira` int(11) DEFAULT NULL,
  `id_alimentador` int(11) DEFAULT NULL,
  `peso_atual` decimal(6,3) DEFAULT NULL,
  `foto_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_pet`),
  KEY `id_usuario` (`id_usuario`),
  KEY `id_coleira` (`id_coleira`),
  KEY `id_alimentador` (`id_alimentador`),
  CONSTRAINT `1` FOREIGN KEY (`id_usuario`) REFERENCES `clientes` (`Id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `posts_blog`
--

DROP TABLE IF EXISTS `posts_blog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `posts_blog` (
  `id_post` int(11) NOT NULL AUTO_INCREMENT,
  `id_categoria` int(11) NOT NULL,
  `id_autor` int(11) DEFAULT NULL,
  `titulo` varchar(200) NOT NULL,
  `resumo` varchar(300) DEFAULT NULL,
  `conteudo` text NOT NULL,
  `imagem_capa_url` varchar(255) DEFAULT NULL,
  `tempo_leitura_min` int(11) DEFAULT NULL,
  `visualizacoes` int(11) DEFAULT 0,
  `data_publicacao` datetime DEFAULT current_timestamp(),
  `ativo` tinyint(1) DEFAULT 1,
  `autor_nome` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id_post`),
  KEY `id_categoria` (`id_categoria`),
  KEY `id_autor` (`id_autor`),
  CONSTRAINT `1` FOREIGN KEY (`id_categoria`) REFERENCES `categorias_blog` (`id_categoria`),
  CONSTRAINT `2` FOREIGN KEY (`id_autor`) REFERENCES `clientes` (`Id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `produtos`
--

DROP TABLE IF EXISTS `produtos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `produtos` (
  `id_produto` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(150) NOT NULL,
  `descricao` text DEFAULT NULL,
  `preco` decimal(10,2) NOT NULL,
  `preco_promocional` decimal(10,2) DEFAULT NULL,
  `imagem_url` varchar(255) DEFAULT NULL,
  `avaliacao_media` decimal(2,1) DEFAULT NULL,
  `qnt_avaliacoes` int(11) DEFAULT 0,
  `ativo` tinyint(1) DEFAULT 1,
  `data_cadastro` datetime DEFAULT current_timestamp(),
  `id_categoria` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_produto`),
  KEY `id_categoria` (`id_categoria`),
  CONSTRAINT `1` FOREIGN KEY (`id_categoria`) REFERENCES `categorias_produto` (`id_categoria`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `recuperacao_senha`
--

DROP TABLE IF EXISTS `recuperacao_senha`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `recuperacao_senha` (
  `id_recuperacao` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `tipo_usuario` enum('cliente','funcionario') NOT NULL,
  `codigo_hash` varchar(255) NOT NULL,
  `expira_em` datetime NOT NULL,
  `tentativas` int(11) NOT NULL DEFAULT 0,
  `usado` tinyint(1) NOT NULL DEFAULT 0,
  `criado_em` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id_recuperacao`),
  KEY `idx_recuperacao_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary table structure for view `vw_pagamentos`
--

DROP TABLE IF EXISTS `vw_pagamentos`;
/*!50001 DROP VIEW IF EXISTS `vw_pagamentos`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
/*!50001 CREATE VIEW `vw_pagamentos` AS SELECT
 1 AS `id_pedido`,
  1 AS `cliente`,
  1 AS `forma_pagamento`,
  1 AS `cartao`,
  1 AS `parcelas`,
  1 AS `valor`,
  1 AS `status`,
  1 AS `data_pagamento` */;
SET character_set_client = @saved_cs_client;

--
-- Dumping routines for database 'happysnouts'
--

--
-- Current Database: `happysnouts`
--

USE `happysnouts`;

--
-- Final view structure for view `vw_pagamentos`
--

/*!50001 DROP VIEW IF EXISTS `vw_pagamentos`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50001 VIEW `vw_pagamentos` AS select `pp`.`id_pedido` AS `id_pedido`,`c`.`nome_completo` AS `cliente`,`f`.`nome` AS `forma_pagamento`,concat(`ct`.`destinatario`,' final ',`ct`.`ultimos_digitos`) AS `cartao`,`pp`.`parcelas` AS `parcelas`,`pp`.`valor` AS `valor`,`pp`.`status` AS `status`,`pp`.`data_pagamento` AS `data_pagamento` from ((((`pagamentos_pedido` `pp` join `pedidos` `p` on(`p`.`id_pedido` = `pp`.`id_pedido`)) join `clientes` `c` on(`c`.`Id_usuario` = `p`.`id_usuario`)) join `formas_pagamento` `f` on(`f`.`id_forma_pagamento` = `pp`.`id_forma_pagamento`)) left join `cartoes` `ct` on(`ct`.`id_cartao` = `pp`.`id_cartao`)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed
