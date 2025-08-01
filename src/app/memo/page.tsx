"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation";
import axios from "axios";
import styles from "./memo.module.css"

type Memo = { id: number; title: string; content: string }

export default function MemoPage() {
  const [memos, setMemos] = useState<Memo[]>([])
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [userId, setUserId] = useState<string | null>(null) // 追加
  const router = useRouter();

  useEffect(() => {
    getUserInfo();
  }, [])

  // ユーザー情報取得
  const getUserInfo = async () => {
    const access_token = localStorage.getItem("access_token");
    if (!access_token) {
      alert("ログインが必要です。");
      router.push("/");
      return;
    }
    try {
      const res = await axios.post(
        "https://cognito-idp.ap-northeast-1.amazonaws.com/",
        { AccessToken: access_token }, 
        {
          headers: {
            "Content-Type": "application/x-amz-json-1.1",
            "X-Amz-Target": "AWSCognitoIdentityProviderService.GetUser"
          }
        }
      );
      const data = res.data;
      if (data.Username) {
        setUserId(data.Username); // 追加
        alert("認証成功！ユーザー: " + data.Username);
        fetchMemos(data.Username); // 追加
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

  // メモ一覧取得
  const fetchMemos = async (uid?: string) => {
    try {
      const id = uid || userId;
      if (!id) return;
      const res = await axios.get(`http://localhost:8080/api/memos?userId=${id}`);
      const data = res.data;
      if (Array.isArray(data)) {
        setMemos(data);
      } else if (Array.isArray(data.memos)) {
        setMemos(data.memos);
      } else {
        setMemos([]);
      }
    } catch {
      setMemos([]);
    }
  };

  // メモ追加 
  const addMemo = async () => {
    if (!userId) return;
    await axios.post("http://localhost:8080/api/memos", { title, content, userId }); // userIdを追加
    setTitle("")
    setContent("")
    await fetchMemos();
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.h1}>メモアプリ</h1>
      <div className={styles.form}>
        <input
          className={styles.input}
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="タイトル"
        />
        <input
          className={styles.input}
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="内容"
        />
        <button className={styles.button} onClick={addMemo}>追加</button>
      </div>
      <ul className={styles.memoList}>
        {Array.isArray(memos) && memos.map(m => (
          <li key={m.id} className={styles.memoItem}>
            <span className={styles.memoTitle}>{m.title}</span>
            <span className={styles.memoContent}>{m.content}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => {
          localStorage.removeItem("access_token");
          router.push("/");
        }}
      >
        ログアウト
      </button>      
    </div>
  )
}