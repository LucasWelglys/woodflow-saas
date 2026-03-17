// No arquivo actions.ts, substitua a parte do .update por esta:

const { error } = await supabase
    .from('marcenarias')
    .upsert({
        dono_id: user.id, // O segredo é o dono_id aqui para ele saber quem é
        nome: formData.nome,
        email_contato: formData.email_contato,
        updated_at: new Date().toISOString()
    }, {
        onConflict: 'dono_id' // Se já tiver um registro para este dono, ele atualiza
    })