<template>
  <footer class="app-footer">
    <div class="footer-decoration"></div>
    <div class="footer-content">
      <div class="footer-message">
        <span class="message-text"
          >轻松办公，轻松管理，轻松命名，轻松财务！</span
        >
        <span class="heart-icon">🤭</span>
      </div>
      <div class="footer-contact">
        <span class="contact-label">联系方式：</span>
        <span class="contact-info">523252405</span>
      </div>
    </div>
  </footer>
</template>

<style lang="scss" scoped>
.app-footer {
  position: relative;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 255, 255, 0.9) 100%
  );
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding: 60px 20px 40px;
  margin-top: auto;
  text-align: center;
  overflow: hidden;

  .footer-decoration {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    clip-path: polygon(0 0%, 100% 40%, 100% 0%, 0% 0%);
  }

  .footer-content {
    position: relative;
    z-index: 2;
    max-width: 800px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: center;

    .footer-message {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 20px;
      font-weight: 600;

      .message-text {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        letter-spacing: -0.3px;
      }

      .heart-icon {
        font-size: 24px;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
        animation: pulse 2s infinite;
      }
    }

    .footer-contact {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      opacity: 0.7;

      .contact-label {
        color: #666;
        font-weight: 400;
      }

      .contact-info {
        font-weight: 500;
        color: #333;
        transition: all 0.3s ease;

        &:hover {
          color: #667eea;
          transform: translateY(-1px);
        }
      }
    }
  }

  @keyframes pulse {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }

  @media (max-width: 768px) {
    padding: 50px 15px 30px;

    .footer-content {
      gap: 14px;

      .footer-message {
        font-size: 18px;

        .heart-icon {
          font-size: 22px;
        }
      }

      .footer-contact {
        font-size: 11px;
      }
    }
  }

  @media (max-width: 480px) {
    .footer-content {
      .footer-message {
        font-size: 16px;
        gap: 8px;

        .heart-icon {
          font-size: 20px;
        }
      }

      .footer-contact {
        flex-direction: column;
        gap: 4px;
        font-size: 10px;
      }
    }
  }
}
</style>
