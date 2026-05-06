import type { Express } from 'express';
import bcrypt from 'bcryptjs';
import { storage } from './storage';
import { getDatabaseInfo } from './db';
import { sendWelcomeEmail } from './email-routes';

const devAdmins = [
  {
    username: 'ziad',
    password: 'ziad123',
    id: 'dev-admin-ziad',
    email: 'ziadchatila2005@gmail.com',
    name: 'Ziad Admin',
  },
  {
    username: 'layane',
    password: 'layane123',
    id: 'dev-admin-layane',
    email: 'layanekanso01@gmail.com',
    name: 'Layane Admin',
  },
];

function isTemporaryDatabaseError(error: unknown) {
  const code = typeof error === 'object' && error ? String((error as { code?: string }).code || '') : '';
  const message = error instanceof Error ? error.message.toLowerCase() : '';

  return (
    ['ECONNRESET', 'PROTOCOL_CONNECTION_LOST', 'ETIMEDOUT', 'EPIPE'].includes(code) ||
    message.includes('econnreset') ||
    message.includes('connection is in closed state') ||
    message.includes('read timeout')
  );
}

async function withDatabaseRetry<T>(operation: () => Promise<T>, attempts = 2): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isTemporaryDatabaseError(error) || attempt === attempts) break;
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
  }

  throw lastError;
}

export function registerAuthRoutes(app: Express) {
 app.get('/api/debug/database', (_req, res) => {
  res.json(getDatabaseInfo());
 });

 app.post('/api/auth/signup', async (req, res) => {
  try {
        console.log('📝 Signup request body:', req.body); // ADD THIS LINE

    const { username, password, name, email, nationality, phone } = req.body;
    const normalizedUsername = String(username || '').trim();
    const normalizedEmail = email ? String(email).trim().toLowerCase() : null;
    const databaseInfo = getDatabaseInfo();
    
    // Validate only username and password
    if (!normalizedUsername || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = await withDatabaseRetry(() => storage.getUserByUsername(normalizedUsername));
    if (existingUser) {
      return res.status(409).json({
        message: `Username already exists in ${databaseInfo.database || 'current database'} on ${databaseInfo.host || 'unknown host'}`,
        field: 'username',
        database: databaseInfo,
      });
    }

    if (normalizedEmail) {
      const existingEmailUser = await withDatabaseRetry(() => storage.getUserByEmail(normalizedEmail));
      if (existingEmailUser) {
        return res.status(409).json({
          message: `Email already exists in ${databaseInfo.database || 'current database'} on ${databaseInfo.host || 'unknown host'}. Try signing in instead.`,
          field: 'email',
          database: databaseInfo,
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    let user;
    try {
      user = await withDatabaseRetry(() =>
        storage.createUser({
          username: normalizedUsername,
          password: hashedPassword,
          name: name || null,
          email: normalizedEmail,
          nationality: nationality || null,
          phone: phone || null,
        }),
      );
    } catch (createError) {
      if (!isTemporaryDatabaseError(createError)) throw createError;

      const createdUser = await withDatabaseRetry(() => storage.getUserByUsername(normalizedUsername));
      if (!createdUser) throw createError;
      user = createdUser;
    }

    sendWelcomeEmail({
      email: user.email,
      name: user.name,
      username: user.username,
    }).catch((emailError) => {
      console.error('Welcome email error:', emailError);
    });

    res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: 'user',
      isAdmin: false,
    });
  } catch (error) {
    console.error('Signup error:', error);
    const errorMessage = error instanceof Error ? error.message : '';
    const databaseInfo = getDatabaseInfo();
    const message = errorMessage.toLowerCase().includes('duplicate')
      ? `Username or email already exists in ${databaseInfo.database || 'current database'} on ${databaseInfo.host || 'unknown host'}`
      : errorMessage.includes('Database not connected')
        ? 'Database is not connected. Check DATABASE_URL and restart the backend.'
        : isTemporaryDatabaseError(error)
          ? 'Temporary database connection issue. Please wait a few seconds and try again.'
        : errorMessage || 'Signup failed';
    res.status(500).json({ message, database: databaseInfo });
  }
});

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const normalizedLogin = String(username || '').trim().toLowerCase();
      const normalizedPassword = String(password || '').trim();

      if (!normalizedLogin || !normalizedPassword) {
        return res.status(400).json({ message: 'Username and password required' });
      }

      const devAdmin = devAdmins.find(
        (admin) =>
          (admin.username === normalizedLogin || admin.email.toLowerCase() === normalizedLogin) &&
          admin.password === normalizedPassword
      );

      if (devAdmin) {
        return res.json({
          id: devAdmin.id,
          username: devAdmin.username,
          email: devAdmin.email,
          name: devAdmin.name,
          role: 'admin',
          isAdmin: true,
        });
      }

      const user = await storage.getUserByUsername(String(username).trim());
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isPasswordValid =
        user.password.startsWith('$2') ? await bcrypt.compare(password, user.password) : user.password === password;

      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: 'user',
        isAdmin: false,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    res.json({ message: 'Logged out' });
  });
}
