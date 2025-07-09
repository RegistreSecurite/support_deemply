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
                mediaFolder: '/src/public/',
                collections: [
                    createFolderCollection({
                        name: 'guide',
                        label: 'Guide',
                        fields: [
                            createField('markdown', { name: 'body' }),
                        ],
                    }),
                ]
            }
        })
    ],
})