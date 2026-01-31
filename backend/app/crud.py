from fastapi import HTTPException
from .auth import get_password_hash
from sqlmodel import Session, select
from datetime import datetime, timezone
from .models import User, UserCreate, OTP


def get_user_by_username(session: Session, username: str):
    """
    ユーザー名からユーザー情報を取得する

    :param session: Session
        データベースセッション
    :param username: str
        検索対象のユーザー名
    :return: User | None
        該当するユーザー、存在しない場合は None
    """
    statement = select(User).where(User.username == username)
    return session.exec(statement).first()


def create_user(session: Session, user_in: UserCreate):
    """
    新規ユーザーを作成する

    :param session: Session
        データベースセッション
    :param user_in: UserCreate
        作成するユーザー情報
    :return: User
        作成されたユーザーオブジェクト
    """
    # パスワードをハッシュ化
    hashed_password = get_password_hash(user_in.password)

    # ハッシュ化済みパスワードでユーザーを生成
    db_user = User(
        username=user_in.username,
        role=user_in.role,
        password=hashed_password,
        email=user_in.email
    )

    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


def verify_otp(session: Session, username: str, input_otp: str):
    """
    指定ユーザーの OTP を検証する

    :param session: Session
        データベースセッション
    :param username: str
        OTP 検証対象のユーザー名
    :param input_otp: str
        ユーザーが入力した OTP コード
    :return: bool
        OTP が有効な場合は True
    :raises HTTPException:
        OTP が未発行、無効、または有効期限切れの場合
    """
    otp_record = session.get(OTP, username)

    if not otp_record:
        raise HTTPException(
            status_code=400,
            detail="OTPが要求されていない、または有効期限が切れています"
        )

    if otp_record.code != input_otp:
        raise HTTPException(
            status_code=400,
            detail="OTPが正しくありません"
        )

    otp_expires_at = otp_record.expires_at
    if otp_expires_at.tzinfo is None:
        otp_expires_at = otp_expires_at.replace(tzinfo=timezone.utc)

    # OTP の有効期限チェック
    if datetime.now(timezone.utc) > otp_expires_at:
        session.delete(otp_record)
        session.commit()
        raise HTTPException(
            status_code=400,
            detail="OTPの有効期限が切れています"
        )

    # 検証成功後、OTP を削除
    session.delete(otp_record)
    session.commit()
    return True


def create_default_admin(session: Session):
    """
    管理者ユーザーが存在しない場合、デフォルトの管理者ユーザーを作成する

    :param session: Session
        データベースセッション
    """
    # 管理者ユーザーの存在確認
    statement = select(User).where(User.username == "admin")
    user = session.exec(statement).first()

    # 存在しない場合は作成
    if not user:
        print("デフォルトの管理者ユーザーを作成します...")
        hashed_pwd = get_password_hash("admin")
        admin_user = User(
            username="admin",
            password=hashed_pwd,
            role="admin"
        )
        session.add(admin_user)
        session.commit()
        print("管理者ユーザーを作成しました（ユーザー名: admin / パスワード: admin）")
    else:
        print("管理者ユーザーは既に存在します。")