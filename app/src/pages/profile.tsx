import { useEffect, useState, type ChangeEvent } from 'react';
import { useRequireAuth } from '../lib/swaAuth';
import { useLanguage } from '../lib/LanguageContext';

const GRAPH_PROFILE_ENDPOINT = '/api/profile/summary';
const GRAPH_PHOTO_ENDPOINT = '/api/profile/photo';

type ProfileData = {
  displayName: string;
  title: string;
  ministryTeam: string;
  campus: string;
  phone: string;
  email: string;
  bio: string;
};

const emptyProfile: ProfileData = {
  displayName: '',
  title: '',
  ministryTeam: '',
  campus: '',
  phone: '',
  email: '',
  bio: '',
};

const ProfilePage = () => {
  const { user, isAuthenticated, isLoading } = useRequireAuth();
  const { lang } = useLanguage();
  const isKo = lang === 'ko';
  const [avatar, setAvatar] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData>(emptyProfile);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [photoStatus, setPhotoStatus] = useState<string | null>(null);
  const [groupNames, setGroupNames] = useState<string[]>([]);
  const [roleNames, setRoleNames] = useState<string[]>([]);
  const [directoryRoleNames, setDirectoryRoleNames] = useState<string[]>([]);

  const labels = {
    profile: isKo ? '프로필' : 'Profile',
    accountTitle: isKo ? '내 계정' : 'Your account',
    accountSubtitle: isKo ? '프로필 정보와 로그인 계정을 관리합니다.' : 'Manage your profile details and login identity.',
    avatar: isKo ? '아바타' : 'Avatar',
    noPhoto: isKo ? 'Entra ID 사진 없음' : 'No photo from Entra ID',
    uploadPhoto: isKo ? '새 사진 업로드' : 'Upload new photo',
    source: isKo ? '출처: Microsoft Entra ID (Graph)' : 'Source: Microsoft Entra ID (Graph)',
    lastSynced: isKo ? '최근 동기화' : 'Last synced',
    identity: isKo ? '계정 정보' : 'Identity',
    email: isKo ? '이메일' : 'Email',
    displayName: isKo ? '표시 이름' : 'Display name',
    title: isKo ? '직책 / 역할' : 'Title / role',
    ministryTeam: isKo ? '사역 팀' : 'Ministry team',
    campus: isKo ? '캠퍼스 / 위치' : 'Campus / location',
    phone: isKo ? '전화' : 'Phone',
    provider: isKo ? '인증 제공자' : 'Provider',
    roles: isKo ? 'SWA 역할' : 'Roles',
    groups: isKo ? 'Entra 그룹' : 'Entra groups',
    appRoles: isKo ? '앱 역할' : 'App roles',
    directoryRoles: isKo ? '디렉터리 역할' : 'Directory roles',
    checking: isKo ? '접근 확인 중...' : 'Checking access...',
    uploadError: isKo ? '이미지 파일만 업로드할 수 있습니다.' : 'Please upload an image file.',
    uploadSizeError: isKo ? '2MB 이하 이미지로 업로드해 주세요.' : 'Please keep the image under 2MB.',
    updateFailed: isKo ? '사진 업데이트 실패.' : 'Photo update failed.',
    updateSuccess: isKo ? 'Entra ID 사진이 업데이트되었습니다.' : 'Photo updated in Entra ID.',
    profileLoadError: isKo ? 'Entra ID에서 프로필을 불러오지 못했습니다.' : 'Unable to load profile from Entra ID.',
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    let isMounted = true;

    const loadProfile = async () => {
      setError(null);
      try {
        const profileRes = await fetch(GRAPH_PROFILE_ENDPOINT, { credentials: 'include' });
        if (profileRes.ok) {
          const data = (await profileRes.json()) as {
            profile?: {
              displayName?: string;
              jobTitle?: string;
              department?: string;
              officeLocation?: string;
              mobilePhone?: string;
              mail?: string;
              userPrincipalName?: string;
            };
            groups?: Array<{ displayName: string }>;
            appRoles?: Array<{ resourceDisplayName: string }>;
            directoryRoles?: Array<{ displayName: string }>;
          };

          const profileData = data.profile || {};
          if (!isMounted) return;
          setProfile({
            displayName: profileData.displayName || '',
            title: profileData.jobTitle || '',
            ministryTeam: profileData.department || '',
            campus: profileData.officeLocation || '',
            phone: profileData.mobilePhone || '',
            email: profileData.mail || profileData.userPrincipalName || user?.userDetails || '',
            bio: '',
          });

          setGroupNames(
            data.groups?.map((group) => group.displayName).filter(Boolean) ?? []
          );
          setRoleNames(
            data.appRoles?.map((role) => role.resourceDisplayName).filter(Boolean) ?? []
          );
          setDirectoryRoleNames(
            data.directoryRoles?.map((role) => role.displayName).filter(Boolean) ?? []
          );
        } else {
          if (!isMounted) return;
          const detail = await profileRes.text();
          setError(`${labels.profileLoadError} (${profileRes.status}) ${detail.slice(0, 120)}`);
        }
      } catch (profileError) {
        if (!isMounted) return;
        setError(labels.profileLoadError);
      }

      try {
        const photoRes = await fetch(GRAPH_PHOTO_ENDPOINT, { credentials: 'include' });
        if (!isMounted) return;
        if (photoRes.ok) {
          const blob = await photoRes.blob();
          if (blob.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = () => {
              if (!isMounted) return;
              const result = typeof reader.result === 'string' ? reader.result : null;
              setAvatar(result);
            };
            reader.readAsDataURL(blob);
          } else {
            setAvatar(null);
          }
        } else {
          setAvatar(null);
        }
      } catch (photoError) {
        if (isMounted) setAvatar(null);
      }

      if (isMounted) {
        setLastSynced(new Date().toLocaleString());
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user]);

  if (isLoading) {
    return <p>{labels.checking}</p>;
  }

  if (!isAuthenticated) {
    return null;
  }

  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError(labels.uploadError);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError(labels.uploadSizeError);
      return;
    }

    setError(null);
    setPhotoStatus(null);
    try {
      const res = await fetch(GRAPH_PHOTO_ENDPOINT, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
        credentials: 'include',
      });
      if (!res.ok) {
        const detail = await res.text();
        setError(`Photo update failed. (${res.status}) ${detail.slice(0, 120)}`);
        return;
      }
      setPhotoStatus(labels.updateSuccess);
      const newAvatar = URL.createObjectURL(file);
      setAvatar(newAvatar);
    } catch (uploadError) {
      setError(labels.updateFailed);
    }
  };

  return (
    <section className="profile-page">
      <div className="section__header">
        <span className="eyebrow">{labels.profile}</span>
        <h1>{labels.accountTitle}</h1>
        <p className="lead">{labels.accountSubtitle}</p>
      </div>

      <div className="profile-grid">
        <article className="card profile-card">
          <h2>{labels.avatar}</h2>
          <div className="avatar-editor">
            {avatar ? (
              <img className="profile-avatar" src={avatar} alt="Profile avatar" />
            ) : (
              <div className="profile-avatar profile-avatar--placeholder">{labels.noPhoto}</div>
            )}
            <div className="avatar-actions">
              <label className="button ghost">
                {labels.uploadPhoto}
                <input type="file" accept="image/*" onChange={handlePhotoUpload} hidden />
              </label>
            </div>
            <p className="muted">{labels.source}</p>
            {error ? <p className="error-text">{error}</p> : null}
            {photoStatus ? <p className="success-text">{photoStatus}</p> : null}
            {lastSynced ? <p className="muted">{labels.lastSynced}: {lastSynced}</p> : null}
          </div>
        </article>

        <article className="card profile-card">
          <h2>{labels.identity}</h2>
          <div className="profile-info">
            <div>
              <span className="muted">{labels.email}</span>
              <p>{profile.email || user?.userDetails || '-'}</p>
            </div>
            <div>
              <span className="muted">{labels.displayName}</span>
              <p>{profile.displayName || user?.userDetails || '-'}</p>
            </div>
            <div>
              <span className="muted">{labels.title}</span>
              <p>{profile.title || '-'}</p>
            </div>
            <div>
              <span className="muted">{labels.ministryTeam}</span>
              <p>{profile.ministryTeam || '-'}</p>
            </div>
            <div>
              <span className="muted">{labels.campus}</span>
              <p>{profile.campus || '-'}</p>
            </div>
            <div>
              <span className="muted">{labels.phone}</span>
              <p>{profile.phone || '-'}</p>
            </div>
            <div>
              <span className="muted">{labels.provider}</span>
              <p>{user?.identityProvider || '-'}</p>
            </div>
            <div>
              <span className="muted">{labels.roles}</span>
              <p>{user?.userRoles?.join(', ') || '-'}</p>
            </div>
            <div>
              <span className="muted">{labels.groups}</span>
              <p>{groupNames.length ? groupNames.join(', ') : '-'}</p>
            </div>
            <div>
              <span className="muted">{labels.appRoles}</span>
              <p>{roleNames.length ? roleNames.join(', ') : '-'}</p>
            </div>
            <div>
              <span className="muted">{labels.directoryRoles}</span>
              <p>{directoryRoleNames.length ? directoryRoleNames.join(', ') : '-'}</p>
            </div>
          </div>
        </article>
      </div>

    </section>
  );
};

export default ProfilePage;
