"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ExpenseReport = {
  id: number;
  userId: string;
  expenseDate: string;
  departureLocation: string;
  arrivalLocation: string;
  transportationMethod: string;
  purpose: string;
  amount: number;
  description: string;
  receiptAttached: boolean;
  status: string;
  createdAt: string;
};

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [pendingExpenses, setPendingExpenses] = useState<ExpenseReport[]>([]);
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
            // 管理者の場合、申請中の経費申請を取得
            fetchPendingExpenses();
          } else {
            setIsAdmin(false);
          }
        })
        .catch(() => {
          setIsAdmin(false);
        });
    }
  }, [router]);

  // 申請中の経費申請を取得
  const fetchPendingExpenses = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/expense-reports/admin/pending');
      const data = await response.json();
      setPendingExpenses(data);
    } catch (error) {
      console.error('経費申請取得エラー:', error);
    }
  };

  // 経費申請承認
  const approveExpense = async (id: number) => {
    try {
      await fetch(`http://localhost:8080/api/expense-reports/admin/approve/${id}`, {
        method: 'PUT'
      });
      // 承認後、一覧を再取得
      fetchPendingExpenses();
    } catch (error) {
      console.error('承認エラー:', error);
    }
  };

  // 経費申請却下
  const rejectExpense = async (id: number) => {
    try {
      await fetch(`http://localhost:8080/api/expense-reports/admin/reject/${id}`, {
        method: 'PUT'
      });
      // 却下後、一覧を再取得
      fetchPendingExpenses();
    } catch (error) {
      console.error('却下エラー:', error);
    }
  };

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
    <main style={{maxWidth: 800, margin: "40px auto", padding: 32, background: "#fff", borderRadius: 20, boxShadow: "0 8px 32px rgba(44,62,80,0.15)"}}>
      <h1 style={{fontSize: "2rem", fontWeight: 700, marginBottom: 24, textAlign: "center"}}>管理者画面</h1>
      <p style={{textAlign: "center", marginBottom: 40}}>このページは管理者のみアクセスできます。</p>
      
      <section>
        <h2 style={{fontSize: "1.5rem", fontWeight: 600, marginBottom: 20, borderBottom: "2px solid #e5e7eb", paddingBottom: 10}}>
          経費申請承認 ({pendingExpenses.length}件)
        </h2>
        
        {pendingExpenses.length === 0 ? (
          <div style={{textAlign: "center", padding: 40, color: "#666"}}>
            承認待ちの経費申請はありません
          </div>
        ) : (
          <div style={{display: "flex", flexDirection: "column", gap: 20}}>
            {pendingExpenses.map(expense => (
              <div key={expense.id} style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 20,
                background: "#f9fafb"
              }}>
                <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16}}>
                  <div>
                    <strong>申請者:</strong> {expense.userId}
                  </div>
                  <div>
                    <strong>申請日:</strong> {new Date(expense.expenseDate).toLocaleDateString("ja-JP")}
                  </div>
                  <div>
                    <strong>出発地:</strong> {expense.departureLocation}
                  </div>
                  <div>
                    <strong>到着地:</strong> {expense.arrivalLocation}
                  </div>
                  <div>
                    <strong>交通手段:</strong> {expense.transportationMethod}
                  </div>
                  <div>
                    <strong>金額:</strong> ¥{expense.amount.toLocaleString()}
                  </div>
                </div>
                <div style={{marginBottom: 16}}>
                  <strong>目的:</strong> {expense.purpose}
                </div>
                {expense.description && (
                  <div style={{marginBottom: 16}}>
                    <strong>備考:</strong> {expense.description}
                  </div>
                )}
                <div style={{display: "flex", gap: 12, justifyContent: "flex-end"}}>
                  <button
                    onClick={() => rejectExpense(expense.id)}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#dc2626",
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontWeight: 500
                    }}
                  >
                    却下
                  </button>
                  <button
                    onClick={() => approveExpense(expense.id)}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#059669",
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontWeight: 500
                    }}
                  >
                    承認
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
