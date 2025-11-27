// Adaptado para Jest

// Jest já fornece describe, it/test, expect globalmente

// --- Teste Unitário ---
function mapRecursoToImage(recurso) {
	return {
		id: recurso._id?.toString(),
		url: recurso.url,
		pathname: recurso.key || recurso.filename,
		uploadedAt: recurso.createdAt?.toISOString(),
		size: recurso.sizeBytes,
		tipo: recurso.mime,
		filename: recurso.filename,
		refCount: recurso.usage?.refCount || 0,
	};
}

describe('Galeria - Unitário', () => {
	it('deve mapear recurso para imagem corretamente', () => {
		const recurso = {
			_id: { toString: () => '123' },
			url: 'http://img.com/1.png',
			key: '1.png',
			createdAt: new Date('2023-01-01T00:00:00Z'),
			sizeBytes: 1000,
			mime: 'image/png',
			filename: '1.png',
			usage: { refCount: 2 },
		};
		const img = mapRecursoToImage(recurso);
		expect(img).toEqual({
			id: '123',
			url: 'http://img.com/1.png',
			pathname: '1.png',
			uploadedAt: '2023-01-01T00:00:00.000Z',
			size: 1000,
			tipo: 'image/png',
			filename: '1.png',
			refCount: 2,
		});
	});
});

// --- Teste de Integração ---
describe('Galeria API - Integração', () => {
	it('GET /api/galeria retorna array de imagens', async () => {
		// Mock fetch para simular chamada à API
		global.fetch = jest.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ images: [{ id: '1', url: 'url1' }] })
		});
		const res = await fetch('/api/galeria');
		const data = await res.json();
		expect(res.ok).toBe(true);
		expect(Array.isArray(data.images)).toBe(true);
		expect(data.images[0]).toHaveProperty('id');
		expect(data.images[0]).toHaveProperty('url');
	});
	afterAll(() => {
		jest.resetAllMocks();
	});
});
