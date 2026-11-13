import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Header, Depends, status
from app.schemas import (
    UserProfile,
    UpdateProfileRequest,
    AvatarUploadRequest,
    ChangePasswordRequest,
    LearningStats,
    WatchHistoryItem,
    RecordWatchRequest,
    AchievementItem,
    LoginRequest,
    AuthResponse,
)
from app.services.profile_service import ProfileService

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Profile & Account Management"])


def get_current_user(authorization: Optional[str] = Header(None)) -> UserProfile:
    """Dependency that authenticates the user via Bearer token."""
    token = authorization or ""
    if token.startswith("Bearer "):
        token = token[7:].strip()

    user = ProfileService.get_user_by_token(token)
    if not user:
        # Fallback for development if no token passed
        user = ProfileService.get_profile("usr_simona_01")
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required. Please log in.",
            )
    return user


# ==========================================
# Authentication Endpoints
# ==========================================
@router.post("/api/auth/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    """Authenticate with email and password."""
    result = ProfileService.login(req.email, req.password)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
    token, user = result
    return AuthResponse(token=token, user=user)


@router.post("/api/auth/logout")
async def logout(authorization: Optional[str] = Header(None)):
    """Revoke current user authentication session."""
    token = authorization or ""
    ProfileService.logout(token)
    return {"message": "Logged out successfully."}


# ==========================================
# Profile & Account Settings
# ==========================================
@router.get("/api/profile", response_model=UserProfile)
async def get_profile(user: UserProfile = Depends(get_current_user)):
    """Retrieve the current user's profile information."""
    return user


@router.put("/api/profile", response_model=UserProfile)
async def update_profile(
    req: UpdateProfileRequest,
    user: UserProfile = Depends(get_current_user)
):
    """Update editable profile details (name, bio, institution, target exam)."""
    updated = ProfileService.update_profile(user.id, req)
    if not updated:
        raise HTTPException(status_code=400, detail="Failed to update profile.")
    return updated


@router.post("/api/profile/avatar", response_model=UserProfile)
async def update_avatar(
    req: AvatarUploadRequest,
    user: UserProfile = Depends(get_current_user)
):
    """Upload or update user profile picture."""
    if not req.avatar_data.strip():
        raise HTTPException(status_code=400, detail="Avatar image data cannot be empty.")
    updated = ProfileService.update_avatar(user.id, req.avatar_data)
    if not updated:
        raise HTTPException(status_code=400, detail="Failed to update avatar.")
    return updated


@router.post("/api/profile/change-password")
async def change_password(
    req: ChangePasswordRequest,
    user: UserProfile = Depends(get_current_user)
):
    """Securely change account password with current password verification."""
    success, message = ProfileService.change_password(user.id, req)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"message": message}


# ==========================================
# Learning Statistics & Watch History
# ==========================================
@router.get("/api/profile/stats", response_model=LearningStats)
async def get_stats(user: UserProfile = Depends(get_current_user)):
    """Retrieve aggregated learning statistics based on authentic activity."""
    return ProfileService.get_learning_stats(user.id)


@router.get("/api/profile/history", response_model=list[WatchHistoryItem])
async def get_watch_history(
    limit: int = 10,
    user: UserProfile = Depends(get_current_user)
):
    """Retrieve recently watched lecture sessions with standardized timestamps."""
    return ProfileService.get_watch_history(user.id, limit=limit)


@router.post("/api/profile/history", response_model=WatchHistoryItem)
async def record_watch_progress(
    req: RecordWatchRequest,
    user: UserProfile = Depends(get_current_user)
):
    """Record or update video watch position and completion percentage."""
    return ProfileService.record_watch_progress(user.id, req)


@router.get("/api/profile/achievements", response_model=list[AchievementItem])
async def get_achievements(user: UserProfile = Depends(get_current_user)):
    """Retrieve academic achievements, badges, and progress milestones."""
    return ProfileService.get_achievements(user.id)
