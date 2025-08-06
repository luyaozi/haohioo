<template>
  <footer class="app-footer">
    <div class="footer-content">
      <div class="footer-message">
        <span class="message-text">让我们和财务同学做好朋友！</span>
        <span class="heart-icon">💝</span>
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px 0;
  margin-top: auto;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);

  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;

    .footer-message {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 500;

      .message-text {
        background: linear-gradient(45deg, #fff, #f0f8ff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .heart-icon {
        font-size: 18px;
        animation: pulse 2s infinite;
      }
    }

    .footer-contact {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      opacity: 0.9;

      .contact-label {
        color: rgba(255, 255, 255, 0.8);
      }

      .contact-info {
        font-weight: 600;
        color: #fff;
        background: rgba(255, 255, 255, 0.1);
        padding: 4px 12px;
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(10px);
        transition: all 0.3s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
      }
    }
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }

  @media (max-width: 768px) {
    padding: 16px 0;

    .footer-content {
      padding: 0 16px;
      gap: 10px;

      .footer-message {
        font-size: 15px;
        
        .heart-icon {
          font-size: 16px;
        }
      }

      .footer-contact {
        font-size: 13px;
      }
    }
  }

  @media (max-width: 480px) {
    .footer-content {
      .footer-message,
      .footer-contact {
        flex-direction: column;
        gap: 4px;
      }
    }
  }
}
</style>