import prisma from '../../db/prisma.js'
import type { GoogleProfile, JwtPayload, UsuarioMeResponse } from './auth.schema.js'

// ─── Busca perfil do usuário no Google 

export async function buscarPerfilGoogle(accessToken: string): Promise<GoogleProfile> {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    throw new Error(`Falha ao buscar perfil Google: ${response.status}`)
  }

  return response.json() as Promise<GoogleProfile>
}

// ─── Cria ou atualiza usuário no banco 

export async function upsertUsuario(profile: GoogleProfile) {
  const totalUsuarios = await prisma.usuario.count()
  const primeiroUsuario = totalUsuarios === 0

  const usuario = await prisma.usuario.upsert({
    where: { googleId: profile.sub },
    update: {
      nome: profile.name,
      avatarUrl: profile.picture,
    },
    create: {
      googleId: profile.sub,
      email: profile.email,
      nome: profile.name,
      avatarUrl: profile.picture,
      role: primeiroUsuario ? 'ADMIN' : 'PARTICIPANTE',
    },
  })

  return usuario
}

// ─── Monta payload do JWT 

export function montarPayloadJwt(usuario: Awaited<ReturnType<typeof upsertUsuario>>): JwtPayload {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    avatarUrl: usuario.avatarUrl,
    role: usuario.role as JwtPayload['role'],
  }
}

// ─── Busca usuário autenticado pelo ID 

export async function buscarUsuarioPorId(id: string): Promise<UsuarioMeResponse | null> {
  return prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      email: true,
      avatarUrl: true,
      role: true,
      criadoEm: true,
    },
  }) as Promise<UsuarioMeResponse | null>
}