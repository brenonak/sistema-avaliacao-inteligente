import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  // Configurar um ou mais provedores de autenticação
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  // callbacks: {
  //   async session({ session, token, user }) {
  //     // Futuramente, usaremos isso para adicionar dados customizados à sessão
  //     return session;
  //   },
  //   async jwt({ token, user, account }) {
  //     // Futuramente, usaremos isso para pegar o access_token do Google
  //     return token;
  //   }
  // }
  // Por enquanto, deixar comentado
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };