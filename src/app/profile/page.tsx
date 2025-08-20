"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation";
import axios from "axios";
import styles from "./profile.module.css"

type UserProfile = {
  id?: number;
  userId: string;
  displayName?: string;
  email?: string;
  phoneNumber?: string;
  postalCode?: string;
  prefecture?: string;
  city?: string;
  addressLine?: string;
  building?: string;
  department?: string;
  position?: string;
  employeeNumber?: string;
  hireDate?: string;
  birthDate?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<UserProfile>({
    userId: "",
    displayName: "",
    email: "",
    phoneNumber: "",
    postalCode: "",
    prefecture: "",
    city: "",
    addressLine: "",
    building: "",
    department: "",
    position: "",
    employeeNumber: "",
    hireDate: "",
    birthDate: "",
    emergencyContactName: "",
    emergencyContactPhone: ""
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter();

  useEffect(() => {
    // クライアントサイドでのみ実行
    if (typeof window !== 'undefined') {
      getUserInfo();
    }
  }, [])

  // ユーザー情報取得
  const getUserInfo = async () => {
    // ブラウザ環境でのみlocalStorageにアクセス
    if (typeof window === 'undefined') {
      return;
    }
    
    const access_token = localStorage.getItem("access_token");
    console.log("Access token:", access_token ? "存在" : "なし"); // デバッグログ
    
    if (!access_token) {
      alert("ログインが必要です。");
      router.push("/login");
      return;
    }
    try {
      console.log("Cognitoへのリクエスト開始"); // デバッグログ
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
      console.log("Cognitoからの応答:", res.data); // デバッグログ
      const data = res.data;
      if (data.Username) {
        setUserId(data.Username);
        await fetchUserProfile(data.Username);
      } else {
        alert("認証エラー");
        localStorage.removeItem("access_token");
        router.push("/login");
      }
    } catch (error) {
      console.error("API通信エラー詳細:", error);
      if (axios.isAxiosError(error)) {
        console.error("エラーレスポンス:", error.response?.data);
        console.error("エラーステータス:", error.response?.status);
        console.error("エラーメッセージ:", error.message);
        
        if (error.response?.status === 400) {
          alert("認証トークンが無効です。再ログインしてください。");
          localStorage.removeItem("access_token");
          router.push("/login");
        } else {
          alert(`API通信エラー: ${error.message}`);
        }
      } else {
        alert("予期しないエラーが発生しました");
      }
    }
  };

  // ユーザープロフィール取得
  const fetchUserProfile = async (uid: string) => {
    try {
      const res = await axios.get(`http://localhost:8080/api/user-profile?userId=${uid}`);
      setProfile({ ...profile, ...res.data, userId: uid });
    } catch (error) {
      // プロフィールが存在しない場合は新規作成用に空のフォームを表示
      setProfile({ ...profile, userId: uid });
    } finally {
      setIsLoading(false);
    }
  };

  // プロフィール保存
  const saveProfile = async () => {
    if (!userId) return;
    
    setIsSaving(true);
    try {
      const profileData = { ...profile, userId };
      await axios.post(`http://localhost:8080/api/user-profile`, profileData);
      alert("プロフィールを保存しました");
    } catch (error) {
      alert("保存に失敗しました");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  // フォーム値更新
  const updateProfile = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  // 都道府県リスト
  const prefectures = [
    "", "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
    "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
    "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
    "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
    "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
    "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
    "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
  ];

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>読み込み中...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.h1}>プロフィール設定</h1>
        <button className={styles.backButton} onClick={() => router.push("/attendance")}>
          勤怠画面に戻る
        </button>
      </div>

      <div className={styles.form}>
        {/* 基本情報 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>基本情報</h2>
          
          <div className={styles.row}>
            <label className={styles.label}>
              表示名:
              <input
                type="text"
                value={profile.displayName || ""}
                onChange={(e) => updateProfile("displayName", e.target.value)}
                className={styles.input}
                placeholder="山田 太郎"
              />
            </label>
          </div>

          <div className={styles.row}>
            <label className={styles.label}>
              メールアドレス:
              <input
                type="email"
                value={profile.email || ""}
                onChange={(e) => updateProfile("email", e.target.value)}
                className={styles.input}
                placeholder="example@company.com"
              />
            </label>
          </div>

          <div className={styles.row}>
            <label className={styles.label}>
              電話番号:
              <input
                type="tel"
                value={profile.phoneNumber || ""}
                onChange={(e) => updateProfile("phoneNumber", e.target.value)}
                className={styles.input}
                placeholder="090-1234-5678"
              />
            </label>
          </div>

          <div className={styles.row}>
            <label className={styles.label}>
              生年月日:
              <input
                type="date"
                value={profile.birthDate || ""}
                onChange={(e) => updateProfile("birthDate", e.target.value)}
                className={styles.input}
              />
            </label>
          </div>
        </section>

        {/* 住所情報 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>住所情報</h2>
          
          <div className={styles.row}>
            <label className={styles.label}>
              郵便番号:
              <input
                type="text"
                value={profile.postalCode || ""}
                onChange={(e) => updateProfile("postalCode", e.target.value)}
                className={styles.input}
                placeholder="123-4567"
              />
            </label>
          </div>

          <div className={styles.row}>
            <label className={styles.label}>
              都道府県:
              <select
                value={profile.prefecture || ""}
                onChange={(e) => updateProfile("prefecture", e.target.value)}
                className={styles.select}
              >
                {prefectures.map((pref, index) => (
                  <option key={index} value={pref}>{pref || "選択してください"}</option>
                ))}
              </select>
            </label>
          </div>

          <div className={styles.row}>
            <label className={styles.label}>
              市区町村:
              <input
                type="text"
                value={profile.city || ""}
                onChange={(e) => updateProfile("city", e.target.value)}
                className={styles.input}
                placeholder="渋谷区"
              />
            </label>
          </div>

          <div className={styles.row}>
            <label className={styles.label}>
              番地:
              <input
                type="text"
                value={profile.addressLine || ""}
                onChange={(e) => updateProfile("addressLine", e.target.value)}
                className={styles.input}
                placeholder="道玄坂1-2-3"
              />
            </label>
          </div>

          <div className={styles.row}>
            <label className={styles.label}>
              建物名・部屋番号:
              <input
                type="text"
                value={profile.building || ""}
                onChange={(e) => updateProfile("building", e.target.value)}
                className={styles.input}
                placeholder="○○ビル 4階"
              />
            </label>
          </div>
        </section>

        {/* 会社情報 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>会社情報</h2>
          
          <div className={styles.row}>
            <label className={styles.label}>
              社員番号:
              <input
                type="text"
                value={profile.employeeNumber || ""}
                onChange={(e) => updateProfile("employeeNumber", e.target.value)}
                className={styles.input}
                placeholder="EMP001"
              />
            </label>
          </div>

          <div className={styles.row}>
            <label className={styles.label}>
              所属部署:
              <input
                type="text"
                value={profile.department || ""}
                onChange={(e) => updateProfile("department", e.target.value)}
                className={styles.input}
                placeholder="営業部"
              />
            </label>
          </div>

          <div className={styles.row}>
            <label className={styles.label}>
              役職:
              <input
                type="text"
                value={profile.position || ""}
                onChange={(e) => updateProfile("position", e.target.value)}
                className={styles.input}
                placeholder="主任"
              />
            </label>
          </div>

          <div className={styles.row}>
            <label className={styles.label}>
              入社日:
              <input
                type="date"
                value={profile.hireDate || ""}
                onChange={(e) => updateProfile("hireDate", e.target.value)}
                className={styles.input}
              />
            </label>
          </div>
        </section>

        {/* 緊急連絡先 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>緊急連絡先</h2>
          
          <div className={styles.row}>
            <label className={styles.label}>
              緊急連絡先（名前）:
              <input
                type="text"
                value={profile.emergencyContactName || ""}
                onChange={(e) => updateProfile("emergencyContactName", e.target.value)}
                className={styles.input}
                placeholder="山田 花子"
              />
            </label>
          </div>

          <div className={styles.row}>
            <label className={styles.label}>
              緊急連絡先（電話番号）:
              <input
                type="tel"
                value={profile.emergencyContactPhone || ""}
                onChange={(e) => updateProfile("emergencyContactPhone", e.target.value)}
                className={styles.input}
                placeholder="090-8765-4321"
              />
            </label>
          </div>
        </section>

        <div className={styles.actions}>
          <button 
            className={styles.saveButton} 
            onClick={saveProfile}
            disabled={isSaving}
          >
            {isSaving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>

      <button
        className={styles.logoutButton}
        onClick={() => {
          localStorage.removeItem("access_token");
          router.push("/login");
        }}
      >
        ログアウト
      </button>
    </div>
  )
}
