"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

const client_id = "4o4aep13lvfknksuasha3h602u";
const tokenUrl = "https://cognito-idp.ap-northeast-1.amazonaws.com/";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  // ログイン処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-amz-json-1.1",
          "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth"
        },
        body: JSON.stringify({
          AuthFlow: "USER_PASSWORD_AUTH",
          ClientId: client_id,
          AuthParameters: {
            USERNAME: email,
            PASSWORD: password
          }
        })
      });

      const data = await res.json();
      if (data.AuthenticationResult?.AccessToken) {
        localStorage.setItem("access_token", data.AuthenticationResult.AccessToken);
        router.push("/attendance");
      } else {
        alert("ログイン失敗");
        console.log(data);
      }
    } catch (error) {
      alert("ログインエラー");
      console.error(error);
    }
  };

  return (
    <main className={styles.loginMain}>
      <div className={styles.loginCard}>
        <h1 className={styles.loginTitle}>Cognito ログイン</h1>
        <form onSubmit={handleSubmit} className={styles.loginForm}>
          <input
            type="email"
            placeholder="メールアドレス"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={styles.loginInput}
          />
          <input
            type="password"
            placeholder="パスワード"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={styles.loginInput}
          />
          <div className={styles.loginActions}>
            <button type="submit" className={`${styles.loginBtn} ${styles.loginBtnPrimary}`}>
              ログイン
            </button>
            <button
              type="button"
              className={`${styles.loginBtn} ${styles.loginBtnSecondary}`}
              onClick={() => router.push("/signup")}
            >
              サインアップ
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
