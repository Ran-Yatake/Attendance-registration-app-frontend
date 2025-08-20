"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./confirm.module.css";

const client_id = "4o4aep13lvfknksuasha3h602u";
const tokenUrl = "https://cognito-idp.ap-northeast-1.amazonaws.com/";

function ConfirmPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") || "";
  const [email, setEmail] = useState(emailFromQuery);
  const [code, setCode] = useState("");

  // 認証コード送信処理
  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmail(emailFromQuery); 
    try {
      
      const res = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-amz-json-1.1",
          "X-Amz-Target": "AWSCognitoIdentityProviderService.ConfirmSignUp"
        },
        body: JSON.stringify({
          ClientId: client_id,
          Username: email,
          ConfirmationCode: code
        })
      });

      const data = await res.json();
      if (data.Session) {
        alert("認証コード送信成功！ログインしてください。");
        router.push("/");
      } else {
        alert("認証コード送信失敗");
        console.log(data);
      }
    } catch (error) {
      alert("認証コード送信エラー");
      console.error(error);
    }
  };

  // 認証コード再送信
  const handleResend = async () => {
    try {
      const res = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-amz-json-1.1",
          "X-Amz-Target": "AWSCognitoIdentityProviderService.ResendConfirmationCode"
        },
        body: JSON.stringify({
          ClientId: client_id,
          Username: email
        })
      });
      await res.json();
      alert("新しい認証コードを送信しました。メールを確認してください。");
    } catch (error) {
      alert("認証コード再送信エラー");
      console.error(error);
    }
  };

  return (
    <main className={styles.confirmMain}>
      <div className={styles.confirmCard}>
        <h1 className={styles.confirmTitle}>認証コード入力</h1>
        <form onSubmit={handleConfirm} className={styles.confirmForm}>
          {/*
          <input
            type="email"
            placeholder="メールアドレス"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={styles.confirmInput}
          />
         */}
          <input
            type="text"
            placeholder="認証コード"
            required
            value={code}
            onChange={e => setCode(e.target.value)}
            className={styles.confirmInput}
          />
          <div className={styles.confirmActions}>
            <button type="submit" className={`${styles.confirmBtn} ${styles.confirmBtnPrimary}`}>
              認証コード送信
            </button>
            <button
              type="button"
              className={`${styles.confirmBtn} ${styles.confirmBtnSecondary}`}
              onClick={handleResend}
            >
              認証コード再送信
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConfirmPageContent />
    </Suspense>
  );
}