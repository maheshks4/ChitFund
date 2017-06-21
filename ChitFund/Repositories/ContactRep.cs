using System.Collections.Generic;
using System.Data;
using ChitFund.Model;

namespace ChitFund.Repositories
{
    public class ContactRep
    {
        private Repository<Contact> rep;

        public ContactRep(IDbConnection db)
        {
            rep = new Repository<Contact>(db);
        }

        public List<Contact> GetAllContacts()
        {
            return rep.GetAll();
        }

        public void Save(Contact c)
        {
            rep.Save(c);
        }

        public void Delete(int id)
        {
            rep.Delete(id);
        }
    }
}