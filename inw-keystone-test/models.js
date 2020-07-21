const { Text, Checkbox, Password, Url, Select, DateTime, CloudinaryImage } = require('@keystonejs/fields');
const { Content } = require('@keystonejs/field-content');
const access = require('./auth')
const adapters = require('./adapters')

const Config = {
  fields: {
    radioActive: { type: Checkbox },
    soundcloudUrl: { type: Url },
    radioStreamUrl: { type: Url },
    isActiveConfig: { type: Boolean },
  },

  access: {
    read: access.userIsAdmin,
    update: access.userIsAdmin,
    create: access.never,
    delete: access.never,
    auth: true,
  },
}

const AudioItem = {
  fields: {
    name: { type: Text, isUnique: true },
    subtitle: { type: Text },
    creator: { type: Text },
    audioType: {
      type: Select, // https://www.keystonejs.com/keystonejs/fields/src/types/select/
      options: [
        { label: 'Mix', value: 'mix' },
        { label: 'Radio Archive', value: 'radio_archive' },
      ],
      isRequired: true
    },
    soundcloudUrl: { type: Url },
    date: { type: DateTime, yearRangeFrom: 2020, isRequired: true },
    mainImage: { type: CloudinaryImage, adapter: adapters.cloudinary },
    body: {
      type: Content,
      blocks: [
        Content.blocks.blockquote,
        Content.blocks.image,
        Content.blocks.link,
        Content.blocks.orderedList,
        Content.blocks.unorderedList,
        Content.blocks.heading,
      ],
    },
  },

  access: {
    read: access.userIsAdminOrOwner,
    update: access.userIsAdminOrOwner,
    create: access.userIsAdmin,
    delete: access.userIsAdmin,
    auth: true,
  },
}

const User = {
  fields: {
    name: { type: Text },
    email: {
      type: Text,
      isUnique: true,
    },
    isAdmin: {
      type: Checkbox,
      // Field-level access controls
      // Here, we set more restrictive field access so a non-admin cannot make themselves admin.
      access: {
        update: access.userIsAdmin,
      },
    },
    password: {
      type: Password,
    },
  },

  access: {
    read: access.userIsAdminOrOwner,
    update: access.userIsAdminOrOwner,
    create: access.userIsAdmin,
    delete: access.userIsAdmin,
    auth: true,
  },
}

const models = { Config, AudioItem, User }

module.exports = models
