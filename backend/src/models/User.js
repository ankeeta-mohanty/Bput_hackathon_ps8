const mongoose = require('mongoose');
const { verifyPassword } = require('../utils/password');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [emailRegex, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    role: {
      type: String,
      required: [true, 'User role is required'],
      enum: {
        values: ['SITE_MANAGER', 'SUBSIDIARY_ESG_MANAGER', 'GROUP_ESG_EXECUTIVE'],
        message: '{VALUE} is not a valid role',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDevelopmentAccount: {
      type: Boolean,
      default: false,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: [true, 'User must belong to a Group'],
    },
    subsidiaryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subsidiary',
      validate: {
        validator: function (val) {
          if (this.role === 'SUBSIDIARY_ESG_MANAGER' || this.role === 'SITE_MANAGER') {
            return !!val;
          }
          return true;
        },
        message: 'Subsidiary ID is required for SUBSIDIARY_ESG_MANAGER and SITE_MANAGER roles',
      },
    },
    siteIds: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'ProjectSite',
        },
      ],
      default: [],
      validate: {
        validator: function (val) {
          if (this.role === 'SITE_MANAGER') {
            return Array.isArray(val) && val.length > 0;
          }
          return true;
        },
        message: 'At least one Project Site ID is required for SITE_MANAGER role',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Remove passwordHash and __v when converting to JSON
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

/**
 * Compare password candidate against stored passwordHash
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return verifyPassword(candidatePassword, this.passwordHash);
};

/**
 * Explicit safe user representation
 */
userSchema.methods.toSafeUser = function () {
  return {
    id: this._id.toString(),
    _id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    isActive: this.isActive,
    isDevelopmentAccount: this.isDevelopmentAccount,
    groupId: this.groupId,
    subsidiaryId: this.subsidiaryId || null,
    siteIds: this.siteIds || [],
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model('User', userSchema);
