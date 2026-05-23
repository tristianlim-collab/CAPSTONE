import { prisma } from '../config/database.js';
import { encrypt, decrypt } from '../utils/encryptionUtil.js';
import { success, error } from '../utils/apiResponse.js';

/**
 * Get all system configurations (decrypted)
 * GET /api/config
 */
export const getAllConfigs = async (req, res) => {
  try {
    const configs = await prisma.systemConfig.findMany({
      select: {
        config_key: true,
        config_value: true,
        description: true,
        is_encrypted: true,
        updated_at: true,
        updated_by: true
      }
    });

    const decryptedConfigs = configs.reduce((acc, conf) => {
      let value = conf.config_value;
      if (conf.is_encrypted && value) {
        // Return dummy value for sensitive config to frontend unless specifically requested
        value = '********'; 
      } else {
        try {
          value = JSON.parse(value);
        } catch {
          // Keep as string if not JSON
        }
      }
      acc[conf.config_key] = value;
      return acc;
    }, {});

    res.status(200).json(success({ data: decryptedConfigs, message: "System configurations fetched" }));
  } catch (err) {
    res.status(500).json(error({ message: err.message }));
  }
};

/**
 * Update system configurations
 * POST /api/config
 * Body: { [config_key]: { value: any, is_encrypted: boolean, description?: string } }
 */
export const updateConfigs = async (req, res) => {
  try {
    const updates = req.body;
    
    // Ensure only admins can update config
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json(error({ message: 'Forbidden' }));
    }

    const results = [];
    
    for (const [key, data] of Object.entries(updates)) {
      if (data.value === '********') continue; // Skip unchanged encrypted fields

      let valueToStore = typeof data.value === 'string' ? data.value : JSON.stringify(data.value);
      
      if (data.is_encrypted) {
        valueToStore = encrypt(valueToStore);
      }

      const updated = await prisma.systemConfig.upsert({
        where: { config_key: key },
        update: {
          config_value: valueToStore,
          is_encrypted: data.is_encrypted,
          description: data.description || undefined,
          updated_by: req.user.id
        },
        create: {
          config_key: key,
          config_value: valueToStore,
          is_encrypted: data.is_encrypted,
          description: data.description,
          updated_by: req.user.id
        }
      });
      
      results.push(updated);
    }

    // Log the configuration change
    await prisma.systemAuditLog.create({
      data: {
        user_id: req.user.id,
        action: 'UPDATE_SYSTEM_CONFIG',
        resource: 'SYSTEM_CONFIG',
        details: `Updated configurations: ${Object.keys(updates).join(', ')}`
      }
    });

    res.status(200).json(success({ data: results, message: "Configurations updated successfully" }));
  } catch (err) {
    res.status(500).json(error({ message: err.message }));
  }
};

/**
 * Internal method to get a decrypted config value
 */
export const getConfigValue = async (key) => {
  try {
    const conf = await prisma.systemConfig.findUnique({ where: { config_key: key } });
    if (!conf) return null;
    
    if (conf.is_encrypted) {
      const decrypted = decrypt(conf.config_value);
      try {
         return JSON.parse(decrypted);
      } catch {
         return decrypted;
      }
    }
    
    try {
      return JSON.parse(conf.config_value);
    } catch {
      return conf.config_value;
    }
  } catch (err) {
    console.error(`Error fetching config ${key}:`, err);
    return null;
  }
};
