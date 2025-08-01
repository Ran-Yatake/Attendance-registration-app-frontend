"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  const callApi = async () => {
    const access_token = localStorage.getItem("access_token");
    console.log(access_token);
    if (!access_token) {
      alert("ログインが必要です。");
      router.push("/");
      return;
    }
    try {
      const res = await fetch("https://cognito-idp.ap-northeast-1.amazonaws.com/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-amz-json-1.1",
          "X-Amz-Target": "AWSCognitoIdentityProviderService.GetUser"
        },
        body: JSON.stringify({
          AccessToken: access_token
        })
      });
      const data = await res.json();
      console.log(data);
      if (data.Username) {
        alert("認証成功！ユーザー: " + data.Username);
      } else {
        alert("認証エラー");
        localStorage.removeItem("access_token");
        router.push("/");
      }
    } catch (error) {
      alert("API通信エラー");
      console.error(error);
    }
  };

  return (
    <main>
      <h1>ダッシュボード</h1>
      <button onClick={callApi}>APIを呼び出す</button>
      <button
        onClick={() => {
          localStorage.removeItem("access_token");
          router.push("/");
        }}
      >
        ログアウト
      </button>
    </main>
  );
}