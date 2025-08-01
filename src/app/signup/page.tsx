"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./signup.module.css";

const client_id = "4o4aep13lvfknksuasha3h602u";
const tokenUrl = "https://cognito-idp.ap-northeast-1.amazonaws.com/";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  // サインアップ処理
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-amz-json-1.1",
          "X-Amz-Target": "AWSCognitoIdentityProviderService.SignUp"
        },
        body: JSON.stringify({
          ClientId: client_id,
          Username: email,
          Password: password
        })
      });

      const data = await res.json();
      if (data.UserConfirmed || data.UserSub) {
        alert("サインアップ成功！確認メールをチェックしてください。");
        router.push(`/confirm?email=${encodeURIComponent(email)}`);
      } else {
        alert("サインアップ失敗");
        console.log(data);
      }
    } catch (error) {
      alert("サインアップエラー");
      console.error(error);
    }
  };

  return (
    <main className={styles.signupMain}>
      <div className={styles.signupCard}>
        <h1 className={styles.signupTitle}>Cognito サインアップ</h1>
        <form onSubmit={handleSignUp} className={styles.signupForm}>
          <input
            type="email"
            placeholder="メールアドレス"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={styles.signupInput}
          />
          <input
            type="password"
            placeholder="パスワード"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={styles.signupInput}
          />
          <div className={styles.signupActions}>
            <button type="submit" className={`${styles.signupBtn} ${styles.signupBtnPrimary}`}>
              サインアップ
            </button>
            <button
              type="button"
              className={`${styles.signupBtn} ${styles.signupBtnSecondary}`}
              onClick={() => router.push("/")}
            >
              ログインへ戻る
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}