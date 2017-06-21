using System.Web.Http;
using ChitFund.Model;
using ChitFund.DbContext;
using System.Collections.Generic;

namespace ChitFund.WebApiControllers
{
    public class CustomerController : ApiController
    {
        public const string dbConnection = "Data Source =|DataDirectory|CFM.db; Version=3;Read Only = False;";

        [Route("~/api/updateContacts")]
        public void Post_UpdateContacts([FromBody] List<Contact> mContactList)
        {          
            using (var uow = new ChitFundDbContext(dbConnection))
            {
                foreach (Contact c in mContactList)
                {
                    uow.Contacts.Save(c);                   
                }
            }
        }

        [Route("~/api/addContacts")]
        public AddContactsResponse Post_AddContacts([FromBody] List<Contact> mContactList)
        {
            var contactIdList = new List<int>();          
            using (var uow = new ChitFundDbContext(dbConnection))
            {
                foreach (Contact c in mContactList)
                {
                    uow.Contacts.Save(c);
                    contactIdList.Add(c.ContactID);
                }
            }

            var resp = new AddContactsResponse();
            resp.ContactIdList = contactIdList;
            return resp;
        }

        [Route("~/api/deleteContacts")]
        public void Post_DeleteContact(List<int> ids)
        {
            using (var uow = new ChitFundDbContext(dbConnection))
            {
                if (ids.Count > 0)
                {
                    ids.ForEach(delegate (int id)
                    {
                        uow.Contacts.Delete(id);
                    });
                }
            }
        }

        [Route("~/api/getContactLists")]
        public ContactListResponse GetContactList()
        {
            var resp = new ContactListResponse();
            resp.Contacts = new Contacts();

            using (var uow = new ChitFundDbContext(dbConnection))
            {
                var customers = uow.Contacts.GetAllContacts();
                foreach (var c in customers)
                {
                    c.PrimaryType = 1;
                    resp.Contacts.Add(c);
                }
            }
            return resp;

            //mocq data
            //var resp = new CustomerListResponse();
            //resp.Customers = new Customers();
            //for (int i = 0; i < 5; i++)
            //{
            //    Customer c1 = new Customer();
            //    c1.CustomerId = i;
            //    c1.Name = "mahesh";
            //    c1.Email = "dsdd@gmail.com";
            //    c1.Phone = "3432324";
            //    c1.PrimaryType = 1;

            //    resp.Customers.Add(c1);
            //}
            //return resp;
        }
    }
}