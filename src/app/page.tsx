"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function HomePage() {
  const router = useRouter();

  // 既にログインしている場合は勤怠ページにリダイレクト
  useEffect(() => {
    // クライアントサイドでのみ実行
    if (typeof window !== 'undefined') {
      const access_token = localStorage.getItem("access_token");
      if (access_token) {
        router.push("/attendance");
      }
    }
  }, [router]);

  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <h1 className={styles.title}>勤怠登録アプリ</h1>
        <p className={styles.subtitle}>
          効率的な勤怠管理で、より良い働き方を実現しましょう
        </p>
        
        <div className={styles.features}>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>🕒</div>
            <h3>簡単な勤怠記録</h3>
            <p>ワンクリックで出退勤の記録が可能</p>
          </div>
          
          <div className={styles.feature}>
            <div className={styles.featureIcon}>📊</div>
            <h3>経費報告</h3>
            <p>交通費などの経費申請も簡単に管理</p>
          </div>
          
          <div className={styles.feature}>
            <div className={styles.featureIcon}>👤</div>
            <h3>プロフィール管理</h3>
            <p>個人情報や連絡先の一元管理</p>
          </div>
          
          <div className={styles.feature}>
            <div className={styles.featureIcon}>📢</div>
            <h3>お知らせ機能</h3>
            <p>重要な連絡事項をリアルタイムで確認</p>
          </div>
        </div>

        <div className={styles.actions}>
          <button 
            className={styles.loginButton}
            onClick={() => router.push("/login")}
          >
            ログイン
          </button>
          <button 
            className={styles.signupButton}
            onClick={() => router.push("/signup")}
          >
            新規登録
          </button>
        </div>
      </div>
      
      <footer className={styles.footer}>
        <p>&copy; 2025 勤怠登録アプリ. All rights reserved.</p>
      </footer>
    </main>
  );
}