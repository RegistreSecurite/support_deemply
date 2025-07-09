import { defineConfig } from 'vite'
import decap, {
    createFolderCollection,
    createField,
} from 'vite-plugin-decap-cms'

export default defineConfig({
    publicDir: 'public',
    plugins: [
        decap({
            config: {
                backend: {
                    name: 'github',
                    repo: 'RegistreSecurite/support_deemply',
                    branch: 'main',
                    authType: 'implicit',
                },
                mediaFolder: 'docs/public/images',
                publicFolder: '/images',
                collections: [
                    createFolderCollection({
                        name: 'guide',
                        label: 'Guide',
                        folder: 'docs/guide',
                        create: true,
                        slug: '{{slug}}',
                        fields: [
                            createField('string', { name: 'title', label: 'Title' }),
                            createField('string', { name: 'description', label: 'Description' }),
                            createField('markdown', { name: 'body', label: 'Body' }),
                        ],
                    }),
                ]
            }
        })
    ],
})