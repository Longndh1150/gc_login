import re
from fastapi import HTTPException

def validate_password_strength(password: str):
    """
    ユーザー登録時にパスワードの強度を検証する

    :param password: str
        検証対象のパスワード
    :return: bool
        条件を満たす場合は True
    :raises HTTPException:
        パスワード強度が不足している場合
    """
    if len(password) < 6:
        raise HTTPException(
            status_code=400,
            detail="パスワードは6文字以上である必要があります"
        )

    if not re.search(r"\d", password):
        raise HTTPException(
            status_code=400,
            detail="パスワードには少なくとも1つの数字を含めてください"
        )

    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        raise HTTPException(
            status_code=400,
            detail="パスワードには少なくとも1つの記号を含めてください"
        )

    return True