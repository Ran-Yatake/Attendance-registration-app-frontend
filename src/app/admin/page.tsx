"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // クライアントサイドのみ
    if (typeof window !== "undefined") {
      const access_token = localStorage.getItem("access_token");
      if (!access_token) {
        router.push("/login");
        return;
      }
      
      // まずCognitoでuserIdを取得
      fetch("https://cognito-idp.ap-northeast-1.amazonaws.com/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-amz-json-1.1",
          "X-Amz-Target": "AWSCognitoIdentityProviderService.GetUser"
        },
        body: JSON.stringify({ AccessToken: access_token })
      })
        .then(res => res.json())
        .then(data => {
          if (data.Username) {
            // userIdでプロフィール取得
            return fetch(`http://localhost:8080/api/user-profile/me?userId=${data.Username}`);
          } else {
            throw new Error("認証エラー");
          }
        })
        .then(res => res.json())
        .then(data => {
          setProfile(data);
          if (data && data.admin === true) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        })
        .catch(() => {
          setIsAdmin(false);
        });
    }
  }, [router]);

  if (isAdmin === null) {
    return <div style={{textAlign: "center", padding: "40px"}}>認証中...</div>;
  }
  if (isAdmin === false) {
    return (
      <main style={{maxWidth: 600, margin: "40px auto", padding: 32, background: "#fff", borderRadius: 20, boxShadow: "0 8px 32px rgba(44,62,80,0.15)", textAlign: "center"}}>
        <h1 style={{fontSize: "2rem", fontWeight: 700, marginBottom: 24}}>権限がありません</h1>
        <pre style={{background: "#eee", padding: 16, borderRadius: 8, textAlign: "left"}}>{JSON.stringify(profile, null, 2)}</pre>
      </main>
    );
  }
  return (
    <main style={{maxWidth: 600, margin: "40px auto", padding: 32, background: "#fff", borderRadius: 20, boxShadow: "0 8px 32px rgba(44,62,80,0.15)", textAlign: "center"}}>
      <h1 style={{fontSize: "2rem", fontWeight: 700, marginBottom: 24}}>管理者画面</h1>
      <p>このページは管理者のみアクセスできます。</p>
    </main>
  );
}
