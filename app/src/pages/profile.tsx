import { useEffect, useState, type ChangeEvent } from 'react';
import { useRequireAuth } from '../lib/swaAuth';

const GRAPH_PROFILE_ENDPOINT = '/api/profile';
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
  const [avatar, setAvatar] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData>(emptyProfile);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [photoStatus, setPhotoStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    let isMounted = true;

    const loadProfile = async () => {
      setError(null);
      try {
        const profileRes = await fetch(GRAPH_PROFILE_ENDPOINT, { credentials: 'include' });
        if (profileRes.ok) {
          const data = (await profileRes.json()) as {
            displayName?: string;
            jobTitle?: string;
            department?: string;
            officeLocation?: string;
            mobilePhone?: string;
            mail?: string;
            userPrincipalName?: string;
          };
          if (!isMounted) return;
          setProfile({
            displayName: data.displayName || '',
            title: data.jobTitle || '',
            ministryTeam: data.department || '',
            campus: data.officeLocation || '',
            phone: data.mobilePhone || '',
            email: data.mail || data.userPrincipalName || user?.userDetails || '',
            bio: '',
          });
        } else {
          if (!isMounted) return;
          const detail = await profileRes.text();
          setError(`Unable to load profile from Entra ID. (${profileRes.status}) ${detail.slice(0, 120)}`);
        }
      } catch (profileError) {
        if (!isMounted) return;
        setError('Unable to load profile from Entra ID.');
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
    return <p>Checking access...</p>;
  }

  if (!isAuthenticated) {
    return null;
  }

  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Please keep the image under 2MB.');
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
      setPhotoStatus('Photo updated in Entra ID.');
      const newAvatar = URL.createObjectURL(file);
      setAvatar(newAvatar);
    } catch (uploadError) {
      setError('Photo update failed.');
    }
  };

  return (
    <section className="profile-page">
      <div className="section__header">
        <span className="eyebrow">Profile</span>
        <h1>Your account</h1>
        <p className="lead">Manage your profile details and login identity.</p>
      </div>

      <div className="profile-grid">
        <article className="card profile-card">
          <h2>Avatar</h2>
          <div className="avatar-editor">
            {avatar ? (
              <img className="profile-avatar" src={avatar} alt="Profile avatar" />
            ) : (
              <div className="profile-avatar profile-avatar--placeholder">No photo from Entra ID</div>
            )}
            <div className="avatar-actions">
              <label className="button ghost">
                Upload new photo
                <input type="file" accept="image/*" onChange={handlePhotoUpload} hidden />
              </label>
            </div>
            <p className="muted">Source: Microsoft Entra ID (Graph)</p>
            {error ? <p className="error-text">{error}</p> : null}
            {photoStatus ? <p className="success-text">{photoStatus}</p> : null}
            {lastSynced ? <p className="muted">Last synced: {lastSynced}</p> : null}
          </div>
        </article>

        <article className="card profile-card">
          <h2>Identity</h2>
          <div className="profile-info">
            <div>
              <span className="muted">Email</span>
              <p>{profile.email || user?.userDetails || '-'}</p>
            </div>
            <div>
              <span className="muted">Display name</span>
              <p>{profile.displayName || user?.userDetails || '-'}</p>
            </div>
            <div>
              <span className="muted">Title / role</span>
              <p>{profile.title || '-'}</p>
            </div>
            <div>
              <span className="muted">Ministry team</span>
              <p>{profile.ministryTeam || '-'}</p>
            </div>
            <div>
              <span className="muted">Campus / location</span>
              <p>{profile.campus || '-'}</p>
            </div>
            <div>
              <span className="muted">Phone</span>
              <p>{profile.phone || '-'}</p>
            </div>
            <div>
              <span className="muted">Provider</span>
              <p>{user?.identityProvider || '-'}</p>
            </div>
            <div>
              <span className="muted">Roles</span>
              <p>{user?.userRoles?.join(', ') || '-'}</p>
            </div>
          </div>
        </article>
      </div>

      <div className="section section--split">
        <article className="glass-card">
          <span className="eyebrow">Profile source</span>
          <h2>Microsoft Entra ID</h2>
          <p className="muted">
            This profile is loaded directly from Entra ID via Microsoft Graph. Local edits are disabled to avoid
            showing non-authoritative data.
          </p>
          <ul className="highlight-list">
            <li>
              <span className="dot" /> Live Entra directory data (display name, title, department)
            </li>
            <li>
              <span className="dot" /> Profile photo pulled from Graph
            </li>
            <li>
              <span className="dot" /> Access controlled by Entra assignments
            </li>
          </ul>
        </article>
        <article className="glass-card">
          <span className="eyebrow">Next step</span>
          <h2>Connect Microsoft Graph</h2>
          <p className="muted">
            The backend functions are expected to proxy Microsoft Graph. This page reads:
          </p>
          <ul className="highlight-list">
            <li>
              <span className="dot" /> GET {GRAPH_PROFILE_ENDPOINT} → displayName, jobTitle, department, officeLocation, mobilePhone
            </li>
            <li>
              <span className="dot" /> GET {GRAPH_PHOTO_ENDPOINT} → photo bytes
            </li>
          </ul>
        </article>
      </div>
    </section>
  );
};

export default ProfilePage;
